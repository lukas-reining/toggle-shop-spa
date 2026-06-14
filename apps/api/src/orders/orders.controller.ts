import { Body, Controller, Post } from "@nestjs/common";
import { OpenFeatureClient, type Client } from "@openfeature/nestjs-sdk";
import type { EvaluationContext } from "@openfeature/server-sdk";
import type { CartItem } from "@toggle-shop/shared";
import { TargetingContext } from "../open-feature/targeting-context.decorator";

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
  create(
    @Body() order: OrderRequest,
    @TargetingContext() context?: EvaluationContext
  ): { message: string } {
    console.log("Order received:", order);

    const value =
      order.items?.reduce(
        (acc, item) => acc + item.price * item.quantity,
        0
      ) ?? 0;

    this.flagClient.track("order_received", context, { value });

    return { message: "Order received successfully" };
  }
}
