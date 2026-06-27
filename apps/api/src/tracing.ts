/**
 * OpenTelemetry bootstrap. This MUST be imported before any other application
 * code (see main.ts) so that instrumentation is registered first.
 *
 * Ported from the original Next.js `instrumentation.ts`, but using the
 * OpenTelemetry Node SDK instead of `@vercel/otel`.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import {
  type MetricReader,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";

const SERVICE_NAME = "toggle-shop-api";

const headers: Record<string, string> = {};
if (process.env.OTLP_AUTHORIZATION) {
  headers["Authorization"] = `Api-Token ${process.env.OTLP_AUTHORIZATION}`;
}

let traceExporter: OTLPTraceExporter | undefined;
if (process.env.OTLP_TRACE_URL) {
  traceExporter = new OTLPTraceExporter({
    url: process.env.OTLP_TRACE_URL,
    headers,
  });
}

let metricReader: MetricReader | undefined;
if (process.env.OTLP_METRICS_URL) {
  // Default the OTel metric reader to a 60s export interval, which is far too
  // slow for a live demo: after flipping a flag you want the dashboard lines to
  // move within seconds. Export every few seconds instead (override with
  // OTEL_METRIC_EXPORT_INTERVAL_MS).
  const exportIntervalMillis = process.env.OTEL_METRIC_EXPORT_INTERVAL_MS
    ? Number(process.env.OTEL_METRIC_EXPORT_INTERVAL_MS)
    : 5000;
  metricReader = new PeriodicExportingMetricReader({
    exportIntervalMillis,
    exporter: new OTLPMetricExporter({
      url: process.env.OTLP_METRICS_URL,
      headers,
    }),
  });
}

export function registerOTel() {
  const sdk = new NodeSDK({
    serviceName: SERVICE_NAME,
    ...(traceExporter ? { traceExporter } : {}),
    ...(metricReader ? { metricReader } : {}),
    // HTTP / Express / NestJS auto-instrumentation gives us request spans
    // (which parent the manual DB spans) and HTTP server duration metrics.
    // `fs` instrumentation is disabled to keep the demo traces readable.
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });
  sdk.start();
}
