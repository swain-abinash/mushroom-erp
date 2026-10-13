import { z } from "zod";
import { CustomerType, ProductStatus, UnitType } from "@prisma/client";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalText = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const money = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .positive(`${label} must be greater than 0.`)
    .max(99_999_999, `${label} is too large.`)
    .multipleOf(0.01, `${label} can have at most 2 decimals.`);

const quantity = (label: string) =>
  z.coerce
    .number({ error: `${label} must be a number.` })
    .positive(`${label} must be greater than 0.`)
    .max(999_999, `${label} is too large.`)
    .multipleOf(0.01, `${label} can have at most 2 decimals.`);

const optionalMoney = (label: string) => z.preprocess(emptyToUndefined, money(label).optional());
const optionalQuantity = (label: string) =>
  z.preprocess(emptyToUndefined, quantity(label).optional());

const checkbox = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

export const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]{1,48}$/;

const productFields = {
  name: z.string().trim().min(2, "Enter a product name.").max(150),
  categoryId: z.uuid("Choose a category."),
  sku: z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() || undefined : value),
    z.string().regex(SKU_PATTERN, "SKU may only contain A–Z, 0–9 and hyphens.").optional(),
  ),
  shortDescription: optionalText(255),
  description: z
    .string()
    .trim()
    .min(10, "Describe the product (at least 10 characters).")
    .max(20_000),
  variety: optionalText(60),
  nutritionInfo: optionalText(5_000),
  storageTips: optionalText(5_000),
  unitType: z.enum(UnitType, { error: "Choose a unit." }),
  retailPrice: money("Retail price"),
  minOrderQty: quantity("Minimum order quantity"),
  shelfLifeDays: z.coerce
    .number({ error: "Shelf life must be a number." })
    .int("Shelf life must be whole days.")
    .min(1, "Shelf life must be at least 1 day.")
    .max(3650),
  status: z.enum(ProductStatus),
  isFeatured: checkbox,
  allowBackorder: checkbox,
  reorderThreshold: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, "Reorder level can't be negative.").max(999_999).optional(),
  ),
};

export const productFormSchema = z.object({
  ...productFields,
  restaurantPrice: optionalMoney("Restaurant price"),
  restaurantMinQty: optionalQuantity("Restaurant minimum quantity"),
  wholesalePrice: optionalMoney("Wholesale price"),
  wholesaleMinQty: optionalQuantity("Wholesale minimum quantity"),
  openingStock: z.preprocess(
    emptyToUndefined,
    z.coerce.number().min(0, "Opening stock can't be negative.").max(999_999).optional(),
  ),
  /** Existing image id, or `new:<index>` for one of the files being uploaded. */
  primaryImage: optionalText(64),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

/** JSON body for `POST /api/v1/products` (DOC-05 §2.2). */
export const productApiSchema = z.object({
  ...productFields,
  status: z.enum(ProductStatus).default(ProductStatus.DRAFT),
  isFeatured: z.boolean().default(false),
  allowBackorder: z.boolean().default(false),
  minOrderQty: quantity("Minimum order quantity").default(1),
  shelfLifeDays: productFields.shelfLifeDays.default(2),
  /** Shorthand from DOC-05 — becomes the Restaurant pricing tier. */
  b2bPrice: money("B2B price").optional(),
  pricingTiers: z
    .array(
      z.object({
        customerType: z.enum([CustomerType.B2B_RESTAURANT, CustomerType.WHOLESALE]),
        price: money("Tier price"),
        minQty: quantity("Tier minimum quantity").default(1),
      }),
    )
    .max(2)
    .optional(),
  openingStock: z.number().min(0).max(999_999).optional(),
  images: z
    .array(
      z.object({
        imageUrl: z
          .string()
          .max(255)
          .refine((url) => url.startsWith("/uploads/") || url.startsWith("https://"), {
            message: "Image URLs must be /uploads/… paths or https:// URLs.",
          }),
        altText: z.string().max(150).optional(),
        isPrimary: z.boolean().default(false),
      }),
    )
    .max(10)
    .default([]),
});

export type ProductApiInput = z.infer<typeof productApiSchema>;

export const productListQuerySchema = z.object({
  category: optionalText(120),
  variety: optionalText(60),
  status: z.enum([ProductStatus.PUBLISHED, ProductStatus.OUT_OF_STOCK]).optional(),
  inStock: z.preprocess((value) => value === "1" || value === "true", z.boolean()).optional(),
  q: optionalText(100),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Enter a category name.").max(100),
  description: optionalText(2_000),
  parentId: z.preprocess(emptyToUndefined, z.uuid().optional()),
  isActive: checkbox,
});

export const stockNotificationSchema = z.object({
  productId: z.uuid(),
  email: z.email("Enter a valid email address.").trim().toLowerCase().max(150),
});
