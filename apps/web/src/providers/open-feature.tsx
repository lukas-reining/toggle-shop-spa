import {
  EvaluationContext,
  OpenFeatureProvider as OFProvider,
  OpenFeature,
} from "@openfeature/react-sdk";
import { OFREPWebProvider } from "@openfeature/ofrep-web-provider";
import { useEffect, useRef } from "react";
import { getOfrepBaseUrl } from "@/libs/config";
import { useSize } from "@/hooks/use-size";

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
      OpenFeature.setProvider(
        new OFREPWebProvider({
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
