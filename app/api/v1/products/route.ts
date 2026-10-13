import { revalidateTag } from "next/cache";
import { apiErrorFrom, apiSuccess, apiValidationError } from "@/lib/api-response";
import { authorizeApi } from "@/lib/auth/api";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { CATALOG_TAG, listStorefrontProducts } from "@/lib/catalog/queries";
import { productApiSchema, productListQuerySchema } from "@/lib/validations/catalog";
import { createProduct, productWriteFromApi } from "@/services/catalog.service";

/** Public catalog listing (DOC-05 §2.2). */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = productListQuerySchema.safeParse(params);
  if (!parsed.success) return apiValidationError(parsed.error);

  const { products, total, page, pageCount } = await listStorefrontProducts(parsed.data);
  return apiSuccess({
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      category: product.category.slug,
      variety: product.variety,
      retailPrice: product.retailPrice,
      b2bPrice: product.b2bPrice,
      pricingTiers: product.pricingTiers,
      unitType: product.unitType,
      minOrderQty: product.minOrderQty,
      availableStock: product.availableStock,
      inStock: product.inStock,
      shelfLifeDays: product.shelfLifeDays,
      primaryImage: product.primaryImage?.url ?? null,
      status: product.status,
    })),
    pagination: { page, limit: parsed.data.limit, total, pageCount },
  });
}

/** Creates a catalog product (requires `catalog:product:manage`). */
export async function POST(request: Request) {
  const auth = await authorizeApi(PERMISSIONS.CATALOG_PRODUCT_MANAGE);
  if (auth.error) return auth.error;

  const parsed = productApiSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const product = await createProduct(auth.user.id, productWriteFromApi(parsed.data), {
      newImageUrls: parsed.data.images,
    });
    revalidateTag(CATALOG_TAG, "max");
    return apiSuccess({ product: { id: product.id, slug: product.slug, sku: product.sku } }, 201);
  } catch (error) {
    return apiErrorFrom(error);
  }
}
