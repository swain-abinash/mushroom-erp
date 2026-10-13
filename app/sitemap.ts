import type { MetadataRoute } from "next";
import { getSitemapProducts } from "@/lib/catalog/queries";
import { appUrl } from "@/lib/url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getSitemapProducts();
  return [
    { url: appUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: appUrl("/products"), changeFrequency: "daily", priority: 0.9 },
    ...products.map((product) => ({
      url: appUrl(`/products/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
