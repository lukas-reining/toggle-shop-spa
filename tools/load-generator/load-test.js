/**
 * Flag-aware k6 load test for the ToggleShop demo.
 *
 * Each virtual user is a synthetic shopper that browses products and sometimes
 * places an order. Two flags drive what the telemetry shows:
 *
 *   - `use-distributed-db` / `use-secure-protocol` (TECHNICAL): every browse
 *     hits the DB layer, so flipping these moves request latency / error rate
 *     in the API's traces + metrics on their own.
 *
 *   - `offer-free-shipping` (BUSINESS): each shopper evaluates this flag (via
 *     flagd's OFREP endpoint) and converts at a higher rate when it is ON, so
 *     flipping it visibly moves orders/min + revenue/min on the dashboard.
 *
 * k6 only generates load here; all dashboard data comes from the API's own
 * OpenTelemetry metrics. k6's request stats + the custom counters below are
 * printed to the k6 output (terminal / `docker compose logs`).
 *
 * Run locally:
 *   k6 run tools/load-generator/load-test.js
 *   k6 run -e VUS=10 -e DURATION=10m tools/load-generator/load-test.js
 *
 * Override the targets when not on localhost (e.g. inside docker-compose):
 *   -e API_BASE_URL=http://api:3001/api -e OFREP_BASE_URL=http://flagd:8016
 */
import http from "k6/http";
import { sleep, check } from "k6";
import { Counter } from "k6/metrics";

const API_BASE_URL = (__ENV.API_BASE_URL || "http://localhost:3001/api").replace(/\/$/, "");
const OFREP_BASE_URL = (__ENV.OFREP_BASE_URL || "http://localhost:8016").replace(/\/$/, "");

// Conversion probability when free shipping is ON vs OFF (the business lever).
const ORDER_PROB_FREE_SHIPPING = numberEnv("ORDER_PROB_FREE_SHIPPING", 0.6);
const ORDER_PROB_BASELINE = numberEnv("ORDER_PROB_BASELINE", 0.22);

// Free shipping also nudges shoppers toward bigger baskets, so the *average
// order value* rises with the flag too -- not just order volume. Baseline
// shoppers buy fewer items in smaller quantities.
const MAX_ITEMS_FREE_SHIPPING = numberEnv("MAX_ITEMS_FREE_SHIPPING", 4);
const MAX_ITEMS_BASELINE = numberEnv("MAX_ITEMS_BASELINE", 2);
const MAX_QTY_FREE_SHIPPING = numberEnv("MAX_QTY_FREE_SHIPPING", 3);
const MAX_QTY_BASELINE = numberEnv("MAX_QTY_BASELINE", 1);

const MIN_DELAY_MS = numberEnv("MIN_DELAY_MS", 200);
const MAX_DELAY_MS = numberEnv("MAX_DELAY_MS", 1200);

const TARGETING_KEY_HEADER = "x-targeting-key";

export const options = {
  scenarios: {
    shoppers: {
      executor: "constant-vus",
      vus: Number(__ENV.VUS || 6),
      duration: __ENV.DURATION || "2h",
    },
  },
  // A few transient errors must never abort a live demo, so no failing
  // thresholds; the checks below just surface problems in the summary.
  summaryTrendStats: ["avg", "min", "med", "p(95)", "p(99)", "max"],
};

// Business metrics, mirrored from the old script so a local run still reports
// conversion at a glance (these live in k6's output, not in Grafana).
const ordersPlaced = new Counter("shop_orders_placed");
const ordersFreeShipping = new Counter("shop_orders_free_shipping");
const revenueEur = new Counter("shop_revenue_eur");

// Per-VU product cache. Module scope persists across iterations within a VU,
// so we fetch the catalogue once per shopper and reuse it to build carts.
let productCache = null;

function numberEnv(name, fallback) {
  const raw = __ENV[name];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const randomDelaySeconds = () =>
  (MIN_DELAY_MS + Math.random() * Math.max(0, MAX_DELAY_MS - MIN_DELAY_MS)) / 1000;
const is2xx = (res) => res.status >= 200 && res.status < 300;

/** Load (and cache, per VU) the product catalogue used to build carts. */
function getProducts(targetingKey) {
  if (productCache && productCache.length > 0) return productCache;
  const res = http.get(`${API_BASE_URL}/products`, {
    headers: { [TARGETING_KEY_HEADER]: targetingKey },
    tags: { name: "GET /products" },
  });
  check(res, { "GET /products is 2xx": is2xx });
  if (!is2xx(res)) return [];
  let body = [];
  try {
    body = res.json();
  } catch (_err) {
    body = [];
  }
  if (Array.isArray(body) && body.length > 0) productCache = body;
  return productCache || [];
}

/** Evaluate `offer-free-shipping` for this shopper via flagd OFREP. */
function isFreeShippingOn(targetingKey) {
  const res = http.post(
    `${OFREP_BASE_URL}/ofrep/v1/evaluate/flags/offer-free-shipping`,
    JSON.stringify({ context: { targetingKey } }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "OFREP evaluate" } }
  );
  if (!is2xx(res)) return false;
  try {
    return res.json("value") === true;
  } catch (_err) {
    return false;
  }
}

/**
 * Build a cart whose size depends on the free-shipping variant. Free-shipping
 * shoppers add more items in larger quantities, so the average order value is
 * visibly higher for the ON variant -- the flag moves AOV, not just volume.
 */
function buildCart(products, freeShipping) {
  const maxItems = freeShipping ? MAX_ITEMS_FREE_SHIPPING : MAX_ITEMS_BASELINE;
  const maxQty = freeShipping ? MAX_QTY_FREE_SHIPPING : MAX_QTY_BASELINE;
  return Array.from({ length: randInt(1, maxItems) }, () => ({
    ...pick(products),
    quantity: randInt(1, maxQty),
  }));
}

/** One shopper session: browse a bit, then maybe order. */
export default function () {
  const targetingKey = uuidv4();
  const headers = { [TARGETING_KEY_HEADER]: targetingKey };

  const products = getProducts(targetingKey);
  sleep(randomDelaySeconds());

  // Browse a handful of product detail pages (drives DB read spans).
  if (products.length > 0) {
    const views = randInt(1, 4);
    for (let i = 0; i < views; i++) {
      const product = pick(products);
      const res = http.get(`${API_BASE_URL}/products/${product.id}`, {
        headers,
        tags: { name: "GET /products/:id" },
      });
      check(res, { "GET /products/:id is 2xx": is2xx });
      sleep(randomDelaySeconds());
    }
  }

  // Business lever: convert more often when free shipping is on.
  const freeShipping = isFreeShippingOn(targetingKey);
  const orderProb = freeShipping ? ORDER_PROB_FREE_SHIPPING : ORDER_PROB_BASELINE;
  if (products.length > 0 && Math.random() < orderProb) {
    const items = buildCart(products, freeShipping);
    const value = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const res = http.post(
      `${API_BASE_URL}/orders`,
      JSON.stringify({ items, customerInfo: { name: "Load Tester" } }),
      { headers: { ...headers, "Content-Type": "application/json" }, tags: { name: "POST /orders" } }
    );
    if (check(res, { "POST /orders is 2xx": is2xx })) {
      ordersPlaced.add(1);
      if (freeShipping) ordersFreeShipping.add(1);
      revenueEur.add(value);
    }
  }

  sleep(randomDelaySeconds());
}
