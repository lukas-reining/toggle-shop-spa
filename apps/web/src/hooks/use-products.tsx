import { useSuspenseQuery } from "@tanstack/react-query";
import type { Product } from "@toggle-shop/shared";
import { setTargetingKeyHeader } from "@toggle-shop/shared";
import { getApiBaseUrl } from "@/libs/config";
import { TARGETING_KEY } from "@/libs/targeting-key";

export function useProducts() {
  const { data } = useSuspenseQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const res = await fetch(getApiBaseUrl() + "/products", {
        cache: "no-store",
        headers: setTargetingKeyHeader(TARGETING_KEY),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      return res.json();
    },
  });
  return data;
}

export function useProduct(id: string) {
  const { data } = useSuspenseQuery({
    queryKey: ["products", id],
    queryFn: async (): Promise<Product> => {
      const res = await fetch(getApiBaseUrl() + `/products/${id}`, {
        cache: "no-store",
        headers: setTargetingKeyHeader(TARGETING_KEY),
      });
      if (!res.ok) {
        throw new Error("Failed to fetch products");
      }
      return res.json();
    },
  });
  return data;
}
