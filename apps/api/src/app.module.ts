import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OpenFeatureModule } from "@openfeature/nestjs-sdk";
import type { EvaluationContext } from "@openfeature/server-sdk";
import { MetricsHook, SpanEventHook } from "@openfeature/open-telemetry-hooks";
import { TARGETING_KEY_HEADER } from "@toggle-shop/shared";
import { FlagdEventProvider } from "./open-feature/flagd-event-provider";
import { HealthModule } from "./health/health.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    OpenFeatureModule.forRoot({
      defaultProvider: new FlagdEventProvider({
        resolverType: "in-process",
        host: process.env.FLAGD_HOST ?? "localhost",
        port: process.env.FLAGD_PORT ? Number(process.env.FLAGD_PORT) : 8015,
      }),
      hooks: [
        // 1. Traces: every evaluation becomes a `feature_flag.evaluation` span
        //    event on the active request span (OTel feature-flag conventions).
        //    The conversion `feature_flag.track` event lands on the same span,
        //    so the two stay independent but correlated through the trace.
        new SpanEventHook(),
        // 2. Metrics: evaluation counters broken down by flag key + variant.
        new MetricsHook(),
      ],
      // Build the per-request evaluation context from the targeting-key header.
      contextFactory: (context): EvaluationContext | undefined => {
        // `context` is the NestJS ExecutionContext.
        const request = context.switchToHttp().getRequest();
        const targetingKey = request?.headers?.[TARGETING_KEY_HEADER];
        if (typeof targetingKey === "string" && targetingKey.length > 0) {
          return { targetingKey };
        }
        return undefined;
      },
    }),
    HealthModule,
    ProductsModule,
    OrdersModule,
  ],
})
export class AppModule {}
