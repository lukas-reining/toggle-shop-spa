import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { events } from "@opentelemetry/api-events";
import { sendTrackEvent } from "../open-feature/send-tracking-event";

const featureFlagEvaluation = events.getEventLogger("feature_flag");

@Controller("events")
export class EventsController {
  @Post("evaluate")
  @HttpCode(202)
  evaluate(@Body() attributes: Record<string, string | number | boolean>): void {
    featureFlagEvaluation.emit({
      name: "feature_flag.evaluation",
      attributes,
    });
  }

  @Post("track")
  @HttpCode(202)
  track(@Body() attributes: Record<string, string | number | boolean>): void {
    sendTrackEvent(attributes);
  }
}
