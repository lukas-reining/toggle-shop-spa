import { Injectable } from "@nestjs/common";
import type { EvaluationContext } from "@openfeature/server-sdk";
import type { Product } from "@toggle-shop/shared";
import { getConnection } from "../db";
import { getGeneratedClient } from "../generated/nodejs/openfeature";

@Injectable()
export class ProductsService {
  async list(context?: EvaluationContext): Promise<Product[]> {
    const flagClient = getGeneratedClient(context);
    const db = await getConnection(flagClient);
    return db.list("products");
  }

  async get(id: number, context?: EvaluationContext): Promise<Product | null> {
    const flagClient = getGeneratedClient(context);
    const db = await getConnection(flagClient);
    return db.get("products", id);
  }
}
