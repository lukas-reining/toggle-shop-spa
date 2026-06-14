import { sendTrackEvent } from "./send-tracking-event";
import { FlagdProvider } from "@openfeature/flagd-provider";
import {
  EvaluationContext,
  Provider,
  TrackingEventDetails,
} from "@openfeature/server-sdk";

// OTel semantic convention attribute for the flag evaluation context id.
const CONTEXT_ID = "feature_flag.context.id";

/**
 * A flagd provider that forwards tracking events to the OpenTelemetry
 * `feature_flag` event logger.
 */
export class FlagdEventProvider extends FlagdProvider implements Provider {
  track(
    trackingEventName: string,
    context?: EvaluationContext,
    trackingEventDetails?: TrackingEventDetails
  ): void {
    sendTrackEvent({
      ["feature_flag.event_name"]: trackingEventName,
      ...(context &&
        context.targetingKey && {
          [CONTEXT_ID]: context.targetingKey,
        }),
      ...context,
      ...trackingEventDetails,
    });
  }
}
