import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CustomerType, Prisma, ProductStatus, UnitType } from "@prisma/client";
import { db } from "@/lib/db";

// Public, cached catalog reads for the storefront. Everything returned is plain JSON (Decimals are
// converted to numbers) so it can cross the `"use cache"` boundary. Admin mutations call
// `updateTag(CATALOG_TAG)` to refresh these immediately.

export const CATALOG_TAG = "catalog";

/** Statuses customers can see. OUT_OF_STOCK stays visible so it can show "notify me". */
const VISIBLE_STATUSES = [ProductStatus.PUBLISHED, ProductStatus.OUT_OF_STOCK];

const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  variety: true,
  shortDescription: true,
  unitType: true,
  retailPrice: true,
  minOrderQty: true,
  shelfLifeDays: true,
  status: true,
  isFeatured: true,
  allowBackorder: true,
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
    take: 1,
    select: { imageUrl: true, altText: true },
  },
  pricingTiers: { select: { customerType: true, price: true, minQty: true } },
  inventoryItem: { select: { availableStock: true, reservedStock: true } },
} satisfies Prisma.ProductSelect;

type ProductCardRow = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export type PricingTierDTO = { customerType: CustomerType; price: number; minQty: number };

export type ProductCardDTO = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  variety: string | null;
  shortDescription: string | null;
  unitType: UnitType;
  retailPrice: number;
  /** Restaurant tier price — the `b2bPrice` of DOC-05. */
  b2bPrice: number | null;
  pricingTiers: PricingTierDTO[];
  minOrderQty: number;
  shelfLifeDays: number;
  status: ProductStatus;
  isFeatured: boolean;
  allowBackorder: boolean;
  availableStock: number;
  inStock: boolean;
  category: { name: string; slug: string };
  primaryImage: { url: string; alt: string } | null;
};

function toCard(row: ProductCardRow): ProductCardDTO {
  const stock = row.inventoryItem
    ? Math.max(
        0,
        row.inventoryItem.availableStock.toNumber() - row.inventoryItem.reservedStock.toNumber(),
      )
    : 0;
  const tiers = row.pricingTiers.map((tier) => ({
    customerType: tier.customerType,
    price: tier.price.toNumber(),
    minQty: tier.minQty.toNumber(),
  }));
  const image = row.images[0];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    variety: row.variety,
    shortDescription: row.shortDescription,
    unitType: row.unitType,
    retailPrice: row.retailPrice.toNumber(),
    b2bPrice:
      tiers.find((tier) => tier.customerType === CustomerType.B2B_RESTAURANT)?.price ?? null,
    pricingTiers: tiers,
    minOrderQty: row.minOrderQty.toNumber(),
    shelfLifeDays: row.shelfLifeDays,
    status: row.status,
    isFeatured: row.isFeatured,
    allowBackorder: row.allowBackorder,
    availableStock: stock,
    inStock: row.status === ProductStatus.PUBLISHED && stock > 0,
    category: row.category,
    primaryImage: image ? { url: image.imageUrl, alt: image.altText ?? row.name } : null,
  };
}

function sortForStorefront(a: ProductCardDTO, b: ProductCardDTO): number {
  return (
    Number(b.inStock) - Number(a.inStock) ||
    Number(b.isFeatured) - Number(a.isFeatured) ||
    a.name.localeCompare(b.name)
  );
}

export type ProductFilters = {
  category?: string;
  variety?: string;
  inStock?: boolean;
  status?: ProductStatus;
  q?: string;
  page?: number;
  limit?: number;
};

/**
 * Filters and paginates in memory: a farm catalog is tens of products, and "in stock" depends on
 * available − reserved stock, which Prisma can't compare in a WHERE clause. Revisit with raw SQL if
 * the catalog grows into the thousands.
 */
export async function listStorefrontProducts(filters: ProductFilters = {}) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");

  const categoryIds = filters.category ? await categoryAndChildrenIds(filters.category) : undefined;
  if (categoryIds && categoryIds.length === 0)
    return { products: [], total: 0, page: 1, pageCount: 0 };

  const rows = await db.product.findMany({
    where: {
      status: filters.status ?? { in: VISIBLE_STATUSES },
      category: { isActive: true },
      categoryId: categoryIds ? { in: categoryIds } : undefined,
      variety: filters.variety,
      OR: filters.q
        ? [{ name: { contains: filters.q } }, { variety: { contains: filters.q } }]
        : undefined,
    },
    select: productCardSelect,
  });

  const all = rows.map(toCard).filter((product) => !filters.inStock || product.inStock);
  all.sort(sortForStorefront);

  const limit = filters.limit ?? 24;
  const pageCount = Math.max(1, Math.ceil(all.length / limit));
  const page = Math.min(Math.max(1, filters.page ?? 1), pageCount);
  return {
    products: all.slice((page - 1) * limit, page * limit),
    total: all.length,
    page,
    pageCount,
  };
}

async function categoryAndChildrenIds(slug: string): Promise<string[]> {
  const category = await db.category.findFirst({
    where: { slug, isActive: true },
    select: { id: true, subCategories: { where: { isActive: true }, select: { id: true } } },
  });
  return category ? [category.id, ...category.subCategories.map((child) => child.id)] : [];
}

export async function getFeaturedProducts(limit = 8) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");

  const { products } = await listStorefrontProducts({ limit: 100 });
  const featured = products.filter((product) => product.isFeatured);
  return (featured.length ? featured : products).slice(0, limit);
}

export type ProductDetailDTO = ProductCardDTO & {
  description: string;
  nutritionInfo: string | null;
  storageTips: string | null;
  images: Array<{ url: string; alt: string }>;
  updatedAt: string;
};

export async function getStorefrontProduct(slug: string): Promise<ProductDetailDTO | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");

  const row = await db.product.findFirst({
    where: { slug, status: { in: VISIBLE_STATUSES }, category: { isActive: true } },
    select: {
      ...productCardSelect,
      description: true,
      nutritionInfo: true,
      storageTips: true,
      updatedAt: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }],
        select: { imageUrl: true, altText: true },
      },
    },
  });
  if (!row) return null;

  return {
    ...toCard(row),
    description: row.description,
    nutritionInfo: row.nutritionInfo,
    storageTips: row.storageTips,
    images: row.images.map((image) => ({ url: image.imageUrl, alt: image.altText ?? row.name })),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getStorefrontCategories() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");

  const categories = await db.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      _count: { select: { products: { where: { status: { in: VISIBLE_STATUSES } } } } },
    },
  });
  return categories.map(({ _count, ...category }) => ({
    ...category,
    productCount: _count.products,
  }));
}

/** Varieties with at least one visible product, for the homepage carousel and catalog filters. */
export async function getVarieties() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");

  const { products } = await listStorefrontProducts({ limit: 1000 });
  const byVariety = new Map<
    string,
    { name: string; productCount: number; image: ProductCardDTO["primaryImage"]; inStock: boolean }
  >();
  for (const product of products) {
    if (!product.variety) continue;
    const entry = byVariety.get(product.variety) ?? {
      name: product.variety,
      productCount: 0,
      image: null,
      inStock: false,
    };
    entry.productCount += 1;
    entry.image ??= product.primaryImage;
    entry.inStock ||= product.inStock;
    byVariety.set(product.variety, entry);
  }
  return [...byVariety.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Sum of sellable kilograms across in-stock fresh produce sold by the kg (homepage badge). */
export async function getAvailableKg(): Promise<number> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("minutes");

  const { products } = await listStorefrontProducts({ inStock: true, limit: 1000 });
  const total = products
    .filter((product) => product.unitType === UnitType.KG)
    .reduce((sum, product) => sum + product.availableStock, 0);
  return Math.round(total * 10) / 10;
}

export async function getSitemapProducts() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const rows = await db.product.findMany({
    where: { status: { in: VISIBLE_STATUSES }, category: { isActive: true } },
    select: { slug: true, updatedAt: true },
  });
  return rows.map((row) => ({ slug: row.slug, updatedAt: row.updatedAt.toISOString() }));
}
