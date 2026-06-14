import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import type { EvaluationContext } from "@openfeature/server-sdk";
import type { Product } from "@toggle-shop/shared";
import { ProductsService } from "./products.service";
import { TargetingContext } from "../open-feature/targeting-context.decorator";

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async list(
    @TargetingContext() context?: EvaluationContext
  ): Promise<Product[]> {
    return this.productsService.list(context);
  }

  @Get(":productId")
  async get(
    @Param("productId", ParseIntPipe) productId: number,
    @TargetingContext() context?: EvaluationContext
  ): Promise<Product> {
    const product = await this.productsService.get(productId, context);
    if (!product) {
      throw new NotFoundException("Product not found");
    }
    return product;
  }
}
