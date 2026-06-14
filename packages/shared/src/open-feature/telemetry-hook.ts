import type {
  BaseHook,
  EvaluationDetails,
  FlagValue,
  HookContext,
} from "@openfeature/core";
// Importing from core so that it works on both the client and server
import { createEvaluationEvent } from "@openfeature/core";

type AttributeValue =
  | string
  | number
  | boolean
  | Array<null | undefined | string>
  | Array<null | undefined | number>
  | Array<null | undefined | boolean>;

export type TelemetryEvent = Record<string, AttributeValue | undefined>;

export class TelemetryHook implements BaseHook {
  constructor(private readonly sendEvent: (event: TelemetryEvent) => void) {}

  finally(
    hookContext: Readonly<HookContext<FlagValue>>,
    evaluationDetails: EvaluationDetails<FlagValue>
  ) {
    const { attributes } = createEvaluationEvent(
      hookContext,
      evaluationDetails
    );
    this.sendEvent(attributes);
  }
}
