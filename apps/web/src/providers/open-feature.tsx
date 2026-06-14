import {
  EvaluationContext,
  OpenFeatureProvider as OFProvider,
  OpenFeature,
  Provider,
  TrackingEventDetails,
} from "@openfeature/react-sdk";
import { OFREPWebProvider } from "@openfeature/ofrep-web-provider";
import { useEffect, useRef } from "react";
import { TelemetryHook } from "@toggle-shop/shared";
import { getApiBaseUrl, getOfrepBaseUrl } from "@/libs/config";
import { useSize } from "@/hooks/use-size";

// OTel semantic convention attribute for the flag evaluation context id.
const CONTEXT_ID = "feature_flag.context.id";

class OFREPWebEventProvider extends OFREPWebProvider implements Provider {
  metadata = { name: "OFREP" };

  track(
    trackingEventName: string,
    context?: EvaluationContext,
    trackingEventDetails?: TrackingEventDetails
  ): void {
    fetch(getApiBaseUrl() + "/events/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ["feature_flag.event_name"]: trackingEventName,
        ...(context &&
          context.targetingKey && {
            [CONTEXT_ID]: context.targetingKey,
          }),
        ...context,
        ...trackingEventDetails,
      }),
    }).catch(console.error);
  }
}

export function OpenFeatureProvider({
  context,
  children,
}: {
  context: EvaluationContext;
  children: React.ReactNode;
}) {
  const hasInitialized = useRef(false);
  const size = useSize();

  useEffect(() => {
    if (hasInitialized.current) {
      OpenFeature.setContext({ ...OpenFeature.getContext(), size });
    }
  }, [size]);

  useEffect(() => {
    if (!hasInitialized.current) {
      console.log("initializing OFREP provider");
      OpenFeature.addHooks(
        new TelemetryHook((event) => {
          fetch(getApiBaseUrl() + "/events/evaluate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(event),
          }).catch(console.error);
        })
      );
      OpenFeature.setProvider(
        new OFREPWebEventProvider({
          baseUrl: getOfrepBaseUrl(),
          // We're polling for updates frequently for demo purposes.
          // A real app may want to only update on page load.
          pollInterval: 5000,
        }),
        { ...context, size }
      );
      hasInitialized.current = true;
    }
    return () => {
      OpenFeature.close();
    };
  });

  return <OFProvider>{children}</OFProvider>;
}
