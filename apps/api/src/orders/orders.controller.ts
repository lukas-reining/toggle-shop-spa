import { Body, Controller, Post } from "@nestjs/common";
import { OpenFeatureClient, type Client } from "@openfeature/nestjs-sdk";
import type { EvaluationContext } from "@openfeature/server-sdk";
import type { CartItem } from "@toggle-shop/shared";
import { TargetingContext } from "../open-feature/targeting-context.decorator";
import { ordersCounter, revenueCounter } from "./order-metrics";

interface OrderRequest {
  items?: CartItem[];
  customerInfo?: Record<string, string>;
}

@Controller("orders")
export class OrdersController {
  constructor(
    @OpenFeatureClient() private readonly flagClient: Client
  ) {}

  @Post()
  async create(
    @Body() order: OrderRequest,
    @TargetingContext() context?: EvaluationContext
  ): Promise<{ message: string }> {
    const value =
      order.items?.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      ) ?? 0;

    // Evaluate the customer-facing flag *at order time* so the business metrics
    // are attributed to the variant the shopper actually experienced. Flipping
    // `offer-free-shipping` then visibly moves order volume + revenue.
    const freeShipping = await this.flagClient.getBooleanDetails(
      "offer-free-shipping",
      false,
      context
    );
    const attributes = {
      "feature_flag.key": "offer-free-shipping",
      "feature_flag.variant": freeShipping.variant
    };

    ordersCounter.add(1, attributes);
    revenueCounter.add(value, attributes);

    // Record the conversion as a `feature_flag.track` span event on the active
    // request span, next to the `feature_flag.evaluation` event above -- the two
    // are correlated through the trace.
    this.flagClient.track("order_received", context, { value });

    return { message: "Order received successfully" };
  }
}
