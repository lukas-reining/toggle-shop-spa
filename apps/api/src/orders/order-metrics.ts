import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("toggle-shop.orders");

/**
 * Number of orders placed, broken down by the `offer-free-shipping` variant
 * that was active when the order was made. Flipping the flag changes the order
 * rate (the "business impact" of the toggle), which shows up directly on this
 * counter.
 */
export const ordersCounter = meter.createCounter("shop.orders.count", {
  description: "Orders placed, split by the active offer-free-shipping variant",
  unit: "{order}",
});

/**
 * Total order value in EUR, broken down by the `offer-free-shipping` variant.
 * Combined with {@link ordersCounter} this yields revenue/min and the average
 * order value per variant.
 */
export const revenueCounter = meter.createCounter("shop.orders.revenue", {
  description: "Order value in EUR, split by the active offer-free-shipping variant",
  unit: "EUR",
});
