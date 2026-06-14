/**
 * OpenTelemetry bootstrap. This MUST be imported before any other application
 * code (see main.ts) so that instrumentation is registered first.
 *
 * Ported from the original Next.js `instrumentation.ts`, but using the
 * OpenTelemetry Node SDK instead of `@vercel/otel`.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-proto";
import {
  type MetricReader,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  type LogRecordProcessor,
  LoggerProvider,
  SimpleLogRecordProcessor,
} from "@opentelemetry/sdk-logs";
import { events } from "@opentelemetry/api-events";
import { logs } from "@opentelemetry/api-logs";
import { EventLoggerProvider } from "@opentelemetry/sdk-events";

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
  metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTLP_METRICS_URL,
      headers,
    }),
  });
}

let logRecordProcessor: LogRecordProcessor | undefined;
if (process.env.OTLP_LOGS_URL) {
  logRecordProcessor = new SimpleLogRecordProcessor(
    new OTLPLogExporter({
      url: process.env.OTLP_LOGS_URL,
      headers,
    })
  );
}

export function registerOTel() {
  const sdk = new NodeSDK({
    serviceName: SERVICE_NAME,
    ...(traceExporter ? { traceExporter } : {}),
    ...(metricReader ? { metricReader } : {}),
  });
  sdk.start();

  // Set up a logger provider so the OTel event logger works.
  const loggerProvider = new LoggerProvider();
  if (logRecordProcessor) {
    loggerProvider.addLogRecordProcessor(logRecordProcessor);
  }
  logs.setGlobalLoggerProvider(loggerProvider);

  console.log("setting global event logger provider");
  events.setGlobalEventLoggerProvider(new EventLoggerProvider(loggerProvider));
}
