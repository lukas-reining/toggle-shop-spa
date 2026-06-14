import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OpenFeatureModule } from "@openfeature/nestjs-sdk";
import type { EvaluationContext } from "@openfeature/server-sdk";
import { events } from "@opentelemetry/api-events";
import { TelemetryHook, TARGETING_KEY_HEADER } from "@toggle-shop/shared";
import { FlagdEventProvider } from "./open-feature/flagd-event-provider";
import { HealthModule } from "./health/health.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { EventsModule } from "./events/events.module";

const eventLogger = events.getEventLogger("feature_flag");

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
        new TelemetryHook((event) => {
          eventLogger.emit({
            name: "feature_flag.evaluation",
            attributes: event,
          });
        }),
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
    EventsModule,
  ],
})
export class AppModule {}
