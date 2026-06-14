import type { Product } from "@toggle-shop/shared";

export interface Database {
  get(table: string, id: number): Promise<Product | null>;
  list(table: string): Promise<Product[]>;
}
