import type { UnitType } from "@prisma/client";

export const UNIT_LABELS: Record<UnitType, { short: string; long: string }> = {
  KG: { short: "kg", long: "Kilogram (kg)" },
  GRAMS_200: { short: "200 g pack", long: "200 g pack" },
  GRAMS_500: { short: "500 g pack", long: "500 g pack" },
  PACK: { short: "pack", long: "Pack" },
  BOTTLE: { short: "bottle", long: "Bottle" },
};

export const UNIT_TYPES = Object.keys(UNIT_LABELS) as UnitType[];

/** Lower-case, hyphenated, ASCII-only URL slug. */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

const SKU_UNIT: Record<UnitType, string> = {
  KG: "1KG",
  GRAMS_200: "200G",
  GRAMS_500: "500G",
  PACK: "PCK",
  BOTTLE: "BTL",
};

function skuSegment(value: string, length: number): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .slice(0, length);
}

/**
 * Builds a readable SKU such as `MUSH-OYS-BLU-1KG` from the category, product name and unit
 * (DOC-05 example format). Uniqueness is enforced by the service, which appends a suffix if needed.
 */
export function generateSku(categoryName: string, productName: string, unitType: UnitType): string {
  const category = skuSegment(categoryName.split(/\s+/).at(-1) ?? "", 4) || "PROD";
  const words = productName.split(/\s+/).filter(Boolean);
  // "Fresh Blue Oyster Mushrooms" → OYS-BLU: the variety noun first, then its descriptor.
  const meaningful = words.filter((word) => !/^(fresh|mushrooms?|organic|the|and)$/i.test(word));
  const parts = (meaningful.length ? meaningful : words).slice(0, 2).reverse();
  const name =
    parts
      .map((word) => skuSegment(word, 3))
      .filter(Boolean)
      .join("-") || "ITEM";
  return `${category}-${name}-${SKU_UNIT[unitType]}`;
}
