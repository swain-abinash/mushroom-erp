import "server-only";
import { CustomerType, ItemCategory, Prisma, ProductStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { deleteUpload, saveImage } from "@/lib/storage";
import { generateSku, slugify, UNIT_LABELS } from "@/lib/catalog/format";
import { AuditService } from "@/services/audit.service";
import type { ProductApiInput, ProductFormInput } from "@/lib/validations/catalog";

// ------------------------------------------------------------------------------
// Categories
// ------------------------------------------------------------------------------

export async function listCategoriesForAdmin() {
  const categories = await db.category.findMany({
    orderBy: [{ parentId: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      isActive: true,
      parentCategory: { select: { name: true } },
      _count: { select: { products: true, subCategories: true } },
    },
  });
  return categories;
}

async function uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "category";
  for (let attempt = 1; ; attempt++) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    const clash = await db.category.findFirst({
      where: { slug, NOT: excludeId ? { id: excludeId } : undefined },
      select: { id: true },
    });
    if (!clash) return slug;
  }
}

/** Categories are two levels deep: a parent must itself be top-level. */
async function assertValidParent(parentId: string | undefined, categoryId?: string) {
  if (!parentId) return;
  if (parentId === categoryId) {
    throw new ServiceError(
      "INVALID_PARENT",
      "A category can't be its own parent.",
      400,
      "parentId",
    );
  }
  const parent = await db.category.findUnique({
    where: { id: parentId },
    select: { parentId: true },
  });
  if (!parent)
    throw new ServiceError("INVALID_PARENT", "Parent category not found.", 400, "parentId");
  if (parent.parentId) {
    throw new ServiceError(
      "INVALID_PARENT",
      "Choose a top-level category as the parent.",
      400,
      "parentId",
    );
  }
  if (categoryId) {
    const children = await db.category.count({ where: { parentId: categoryId } });
    if (children > 0) {
      throw new ServiceError(
        "INVALID_PARENT",
        "This category has sub-categories, so it must stay top-level.",
        400,
        "parentId",
      );
    }
  }
}

type CategoryInput = { name: string; description?: string; parentId?: string; isActive: boolean };

export async function createCategory(actorId: string, input: CategoryInput) {
  await assertValidParent(input.parentId);
  const category = await db.category.create({
    data: {
      name: input.name,
      slug: await uniqueCategorySlug(input.name),
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      isActive: input.isActive,
    },
  });
  await AuditService.logEvent({
    actorId,
    action: "CATEGORY_CREATED",
    entityType: "Category",
    entityId: category.id,
    newState: { name: category.name, slug: category.slug, parentId: category.parentId },
  });
  return category;
}

export async function updateCategory(actorId: string, categoryId: string, input: CategoryInput) {
  const existing = await db.category.findUnique({ where: { id: categoryId } });
  if (!existing) throw new ServiceError("NOT_FOUND", "Category not found.", 404);
  await assertValidParent(input.parentId, categoryId);

  // The slug is kept on rename so storefront links and SEO stay stable.
  const category = await db.category.update({
    where: { id: categoryId },
    data: {
      name: input.name,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      isActive: input.isActive,
    },
  });
  await AuditService.logEvent({
    actorId,
    action: "CATEGORY_UPDATED",
    entityType: "Category",
    entityId: categoryId,
    oldState: { name: existing.name, parentId: existing.parentId, isActive: existing.isActive },
    newState: { name: category.name, parentId: category.parentId, isActive: category.isActive },
  });
  return category;
}

// ------------------------------------------------------------------------------
// Products — reads
// ------------------------------------------------------------------------------

export async function listProductsForAdmin(filters: {
  q?: string;
  categoryId?: string;
  status?: ProductStatus;
}) {
  const products = await db.product.findMany({
    where: {
      categoryId: filters.categoryId,
      status: filters.status,
      OR: filters.q
        ? [
            { name: { contains: filters.q } },
            { sku: { contains: filters.q } },
            { variety: { contains: filters.q } },
          ]
        : undefined,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      sku: true,
      slug: true,
      variety: true,
      unitType: true,
      retailPrice: true,
      status: true,
      isFeatured: true,
      category: { select: { name: true } },
      images: { where: { isPrimary: true }, take: 1, select: { imageUrl: true, altText: true } },
      inventoryItem: {
        select: { availableStock: true, reservedStock: true, reorderThreshold: true },
      },
    },
  });
  return products.map(({ images, inventoryItem, retailPrice, ...product }) => ({
    ...product,
    retailPrice: retailPrice.toNumber(),
    primaryImage: images[0] ?? null,
    stock: inventoryItem
      ? inventoryItem.availableStock.toNumber() - inventoryItem.reservedStock.toNumber()
      : null,
    lowStock: inventoryItem
      ? inventoryItem.availableStock.lte(inventoryItem.reorderThreshold)
      : false,
  }));
}

export async function getProductForEdit(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
      pricingTiers: true,
      inventoryItem: true,
      category: { select: { name: true, slug: true } },
    },
  });
  if (!product) return null;

  const tier = (type: CustomerType) => product.pricingTiers.find((t) => t.customerType === type);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    shortDescription: product.shortDescription ?? "",
    description: product.description,
    variety: product.variety ?? "",
    nutritionInfo: product.nutritionInfo ?? "",
    storageTips: product.storageTips ?? "",
    unitType: product.unitType,
    retailPrice: product.retailPrice.toString(),
    minOrderQty: product.minOrderQty.toString(),
    shelfLifeDays: String(product.shelfLifeDays),
    status: product.status,
    isFeatured: product.isFeatured,
    allowBackorder: product.allowBackorder,
    restaurantPrice: tier(CustomerType.B2B_RESTAURANT)?.price.toString() ?? "",
    restaurantMinQty: tier(CustomerType.B2B_RESTAURANT)?.minQty.toString() ?? "",
    wholesalePrice: tier(CustomerType.WHOLESALE)?.price.toString() ?? "",
    wholesaleMinQty: tier(CustomerType.WHOLESALE)?.minQty.toString() ?? "",
    reorderThreshold: product.inventoryItem?.reorderThreshold.toString() ?? "",
    stock: product.inventoryItem
      ? product.inventoryItem.availableStock.toNumber() -
        product.inventoryItem.reservedStock.toNumber()
      : null,
    images: product.images.map((image) => ({
      id: image.id,
      imageUrl: image.imageUrl,
      altText: image.altText,
      isPrimary: image.isPrimary,
    })),
  };
}

export type ProductForEdit = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;

// ------------------------------------------------------------------------------
// Products — writes
// ------------------------------------------------------------------------------

type TierInput = { customerType: CustomerType; price: number; minQty: number };

/** The product columns shared by the admin form and the JSON API. */
function pickProductFields(input: ProductFormInput | ProductApiInput) {
  return {
    name: input.name,
    categoryId: input.categoryId,
    sku: input.sku,
    shortDescription: input.shortDescription,
    description: input.description,
    variety: input.variety,
    nutritionInfo: input.nutritionInfo,
    storageTips: input.storageTips,
    unitType: input.unitType,
    retailPrice: input.retailPrice,
    minOrderQty: input.minOrderQty,
    shelfLifeDays: input.shelfLifeDays,
    status: input.status,
    isFeatured: input.isFeatured,
    allowBackorder: input.allowBackorder,
  };
}

type ProductWrite = {
  fields: ReturnType<typeof pickProductFields>;
  tiers: TierInput[];
  reorderThreshold?: number;
  openingStock?: number;
};

type ImageChanges = {
  newFiles?: File[];
  newImageUrls?: Array<{ imageUrl: string; altText?: string; isPrimary?: boolean }>;
  removeImageIds?: string[];
  /** Existing image id or `new:<index>` (index into the new images, files first). */
  primaryImage?: string;
};

export function tiersFromForm(input: ProductFormInput): TierInput[] {
  const tiers: TierInput[] = [];
  if (input.restaurantPrice) {
    tiers.push({
      customerType: CustomerType.B2B_RESTAURANT,
      price: input.restaurantPrice,
      minQty: input.restaurantMinQty ?? 1,
    });
  }
  if (input.wholesalePrice) {
    tiers.push({
      customerType: CustomerType.WHOLESALE,
      price: input.wholesalePrice,
      minQty: input.wholesaleMinQty ?? 1,
    });
  }
  return tiers;
}

export function productWriteFromForm(input: ProductFormInput): ProductWrite {
  return {
    fields: pickProductFields(input),
    tiers: tiersFromForm(input),
    reorderThreshold: input.reorderThreshold,
    openingStock: input.openingStock,
  };
}

export function productWriteFromApi(input: ProductApiInput): ProductWrite {
  const tiers: TierInput[] = (input.pricingTiers ?? []).map((tier) => ({ ...tier }));
  if (input.b2bPrice && !tiers.some((tier) => tier.customerType === CustomerType.B2B_RESTAURANT)) {
    tiers.push({ customerType: CustomerType.B2B_RESTAURANT, price: input.b2bPrice, minQty: 1 });
  }
  return {
    fields: pickProductFields(input),
    tiers,
    reorderThreshold: input.reorderThreshold,
    openingStock: input.openingStock,
  };
}

async function uniqueValue(
  base: string,
  field: "sku" | "slug",
  separator: string,
  excludeId?: string,
): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const value = attempt === 1 ? base : `${base}${separator}${attempt}`;
    const clash = await db.product.findFirst({
      where: { [field]: value, NOT: excludeId ? { id: excludeId } : undefined },
      select: { id: true },
    });
    if (!clash) return value;
  }
}

function tiersEqual(a: TierInput[], b: TierInput[]): boolean {
  const key = (tiers: TierInput[]) =>
    tiers
      .map((t) => `${t.customerType}:${Number(t.price).toFixed(2)}:${Number(t.minQty).toFixed(2)}`)
      .sort()
      .join("|");
  return key(a) === key(b);
}

/**
 * Saves uploaded files and combines them with any image URLs passed in. `savedUrls` lists only the
 * files written by this call — the ones to delete again if the database write fails.
 */
async function storeNewImages(changes: ImageChanges): Promise<{
  images: Array<{ imageUrl: string; altText?: string; isPrimary?: boolean }>;
  savedUrls: string[];
}> {
  const savedUrls: string[] = [];
  try {
    for (const file of changes.newFiles ?? []) savedUrls.push(await saveImage(file, "products"));
  } catch (error) {
    await Promise.all(savedUrls.map(deleteUpload));
    throw error;
  }
  return {
    images: [...savedUrls.map((imageUrl) => ({ imageUrl })), ...(changes.newImageUrls ?? [])],
    savedUrls,
  };
}

/** Deletes uploaded files no product image points at any more (the API may reuse an image URL). */
async function deleteUnreferencedUploads(urls: string[]) {
  for (const url of new Set(urls)) {
    const stillUsed = await db.productImage.count({ where: { imageUrl: url } });
    if (stillUsed === 0) await deleteUpload(url);
  }
}

function isUniqueViolation(error: unknown, field: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    String(error.meta?.target ?? "").includes(field)
  );
}

export async function createProduct(
  actorId: string,
  write: ProductWrite,
  images: ImageChanges = {},
) {
  const category = await db.category.findUnique({
    where: { id: write.fields.categoryId },
    select: { name: true },
  });
  if (!category)
    throw new ServiceError("INVALID_CATEGORY", "Choose a valid category.", 400, "categoryId");

  const sku = write.fields.sku
    ? write.fields.sku
    : await uniqueValue(
        generateSku(category.name, write.fields.name, write.fields.unitType),
        "sku",
        "-",
      );
  const slug = await uniqueValue(slugify(write.fields.name) || "product", "slug", "-");
  const { images: newImages, savedUrls } = await storeNewImages(images);

  try {
    return await db.$transaction(async (tx) => {
      const primaryIndex = images.primaryImage?.startsWith("new:")
        ? Number(images.primaryImage.slice(4))
        : newImages.findIndex((image) => image.isPrimary);
      const product = await tx.product.create({
        data: {
          ...write.fields,
          sku,
          slug,
          images: {
            create: newImages.map((image, index) => ({
              imageUrl: image.imageUrl,
              altText: image.altText ?? write.fields.name,
              displayOrder: index,
              isPrimary: index === (primaryIndex >= 0 ? primaryIndex : 0),
            })),
          },
          pricingTiers: { create: write.tiers },
          inventoryItem: {
            create: {
              itemName: write.fields.name,
              itemCategory: ItemCategory.FINISHED_PRODUCT,
              availableStock: write.openingStock ?? 0,
              unit: UNIT_LABELS[write.fields.unitType].short,
              reorderThreshold: write.reorderThreshold ?? 5,
            },
          },
        },
        include: { inventoryItem: { select: { id: true } } },
      });

      if (write.openingStock && product.inventoryItem) {
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: product.inventoryItem.id,
            transactionType: "MANUAL_ADJUSTMENT",
            quantity: write.openingStock,
            balanceAfter: write.openingStock,
            referenceType: "Product",
            referenceId: product.id,
            reason: "Opening stock",
            performedBy: actorId,
          },
        });
      }

      await AuditService.logEvent(
        {
          actorId,
          action: "PRODUCT_CREATED",
          entityType: "Product",
          entityId: product.id,
          newState: {
            name: product.name,
            sku: product.sku,
            retailPrice: write.fields.retailPrice,
            tiers: write.tiers,
            status: product.status,
          },
        },
        tx,
      );
      return product;
    });
  } catch (error) {
    await Promise.all(savedUrls.map(deleteUpload));
    if (isUniqueViolation(error, "sku")) {
      throw new ServiceError("SKU_TAKEN", "Another product already uses this SKU.", 409, "sku");
    }
    throw error;
  }
}

export async function updateProduct(
  actorId: string,
  productId: string,
  write: ProductWrite,
  images: ImageChanges,
  options: { canOverridePricing: boolean },
) {
  const existing = await db.product.findUnique({
    where: { id: productId },
    include: { pricingTiers: true, images: true },
  });
  if (!existing) throw new ServiceError("NOT_FOUND", "Product not found.", 404);

  const priceChanged =
    existing.retailPrice.toNumber() !== write.fields.retailPrice ||
    !tiersEqual(
      existing.pricingTiers.map((t) => ({
        customerType: t.customerType,
        price: t.price.toNumber(),
        minQty: t.minQty.toNumber(),
      })),
      write.tiers,
    );
  if (priceChanged && !options.canOverridePricing) {
    throw new ServiceError(
      "PRICING_OVERRIDE_REQUIRED",
      "Only founder admins can change the prices of an existing product.",
      403,
      "retailPrice",
    );
  }

  const removeIds = new Set(
    (images.removeImageIds ?? []).filter((id) => existing.images.some((image) => image.id === id)),
  );
  const removed = existing.images.filter((image) => removeIds.has(image.id));
  const kept = existing.images.filter((image) => !removeIds.has(image.id));
  const { images: newImages, savedUrls } = await storeNewImages(images);

  try {
    const product = await db.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          ...write.fields,
          // Cleared optional fields must be written as null (undefined would leave them unchanged).
          shortDescription: write.fields.shortDescription ?? null,
          variety: write.fields.variety ?? null,
          nutritionInfo: write.fields.nutritionInfo ?? null,
          storageTips: write.fields.storageTips ?? null,
          sku: write.fields.sku ?? existing.sku,
          pricingTiers: { deleteMany: {}, create: write.tiers },
          inventoryItem: {
            upsert: {
              create: {
                itemName: write.fields.name,
                itemCategory: ItemCategory.FINISHED_PRODUCT,
                unit: UNIT_LABELS[write.fields.unitType].short,
                reorderThreshold: write.reorderThreshold ?? 5,
              },
              update: {
                itemName: write.fields.name,
                unit: UNIT_LABELS[write.fields.unitType].short,
                reorderThreshold: write.reorderThreshold,
              },
            },
          },
        },
      });

      if (removeIds.size)
        await tx.productImage.deleteMany({ where: { id: { in: [...removeIds] } } });

      const created = [];
      for (const [index, image] of newImages.entries()) {
        created.push(
          await tx.productImage.create({
            data: {
              productId,
              imageUrl: image.imageUrl,
              altText: image.altText ?? write.fields.name,
              displayOrder: kept.length + index,
            },
          }),
        );
      }

      // Exactly one primary image: the chosen one, else the current primary, else the first image.
      const all = [...kept, ...created];
      const chosen = images.primaryImage?.startsWith("new:")
        ? created[Number(images.primaryImage.slice(4))]?.id
        : all.find((image) => image.id === images.primaryImage)?.id;
      const primaryId = chosen ?? kept.find((image) => image.isPrimary)?.id ?? all[0]?.id;
      if (all.length) {
        await tx.productImage.updateMany({ where: { productId }, data: { isPrimary: false } });
        if (primaryId)
          await tx.productImage.update({ where: { id: primaryId }, data: { isPrimary: true } });
      }

      await AuditService.logEvent(
        {
          actorId,
          action: "PRODUCT_UPDATED",
          entityType: "Product",
          entityId: productId,
          oldState: {
            name: existing.name,
            sku: existing.sku,
            status: existing.status,
            retailPrice: existing.retailPrice.toNumber(),
            tiers: existing.pricingTiers.map((t) => ({
              customerType: t.customerType,
              price: t.price.toNumber(),
              minQty: t.minQty.toNumber(),
            })),
          },
          newState: {
            name: product.name,
            sku: product.sku,
            status: product.status,
            retailPrice: write.fields.retailPrice,
            tiers: write.tiers,
            imagesAdded: created.length,
            imagesRemoved: removed.length,
          },
        },
        tx,
      );
      return product;
    });

    await deleteUnreferencedUploads(removed.map((image) => image.imageUrl));
    return product;
  } catch (error) {
    await Promise.all(savedUrls.map(deleteUpload));
    if (isUniqueViolation(error, "sku")) {
      throw new ServiceError("SKU_TAKEN", "Another product already uses this SKU.", 409, "sku");
    }
    throw error;
  }
}

/** Products referenced by orders can't be deleted, so removal from sale is done by archiving. */
export async function archiveProduct(actorId: string, productId: string) {
  const existing = await db.product.findUnique({
    where: { id: productId },
    select: { status: true },
  });
  if (!existing) throw new ServiceError("NOT_FOUND", "Product not found.", 404);

  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id: productId }, data: { status: ProductStatus.ARCHIVED } });
    await AuditService.logEvent(
      {
        actorId,
        action: "PRODUCT_ARCHIVED",
        entityType: "Product",
        entityId: productId,
        oldState: { status: existing.status },
        newState: { status: ProductStatus.ARCHIVED },
      },
      tx,
    );
  });
}

// ------------------------------------------------------------------------------
// Back-in-stock notifications
// ------------------------------------------------------------------------------

export async function requestStockNotification(productId: string, email: string, userId?: string) {
  const product = await db.product.findFirst({
    where: { id: productId, status: { in: [ProductStatus.PUBLISHED, ProductStatus.OUT_OF_STOCK] } },
    select: { id: true },
  });
  if (!product) throw new ServiceError("NOT_FOUND", "Product not found.", 404);

  await db.stockNotification.upsert({
    where: { productId_email: { productId, email } },
    update: { notifiedAt: null, userId: userId ?? undefined },
    create: { productId, email, userId: userId ?? null },
  });
}
