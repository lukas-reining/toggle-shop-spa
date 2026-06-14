import {
  createParamDecorator,
  ExecutionContext,
} from "@nestjs/common";
import type { EvaluationContext } from "@openfeature/server-sdk";
import { TARGETING_KEY_HEADER } from "@toggle-shop/shared";

/**
 * Param decorator that extracts the OpenFeature evaluation context from the
 * incoming request's `x-targeting-key` header.
 *
 * Replaces the original `headerToEvaluationContext` helper.
 */
export const TargetingContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): EvaluationContext | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const targetingKey = request.headers?.[TARGETING_KEY_HEADER];
    if (typeof targetingKey === "string" && targetingKey.length > 0) {
      return { targetingKey };
    }
    return undefined;
  }
);
