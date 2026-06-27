import { FlagdProvider } from "@openfeature/flagd-provider";
import {
  EvaluationContext,
  Provider,
  TrackingEventDetails,
} from "@openfeature/server-sdk";
import { type Attributes, trace } from "@opentelemetry/api";

// OTel semantic convention attribute for the flag evaluation context id.
const CONTEXT_ID = "feature_flag.context.id";

/**
 * A flagd provider that records tracking events as a `feature_flag.track`
 * span event on the active request span.
 *
 * The OpenFeature OTel `SpanEventHook` already records a
 * `feature_flag.evaluation` span event for every flag evaluation. Recording the
 * conversion on the same span means the evaluation and its outcome stay two
 * independent events correlated purely through the trace -- no need to copy the
 * resolved variant onto the conversion event.
 */
export class FlagdEventProvider extends FlagdProvider implements Provider {
  track(
    trackingEventName: string,
    context?: EvaluationContext,
    trackingEventDetails?: TrackingEventDetails
  ): void {
    const attributes: Attributes = {
      "feature_flag.event_name": trackingEventName,
    };

    if (context?.targetingKey) {
      attributes[CONTEXT_ID] = context.targetingKey;
    }

    // Copy through any flat tracking details (e.g. the order `value`). Span
    // event attributes must be primitives, so skip structured/Date values.
    if (trackingEventDetails) {
      for (const [key, value] of Object.entries(trackingEventDetails)) {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          attributes[key] = value;
        }
      }
    }

    trace.getActiveSpan()?.addEvent("feature_flag.track", attributes);
  }
}
