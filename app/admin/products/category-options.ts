import "server-only";
import { db } from "@/lib/db";

/** Categories for product forms and filters; sub-categories are labelled "Parent › Child". */
export async function getCategoryOptions() {
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true, parentCategory: { select: { name: true } } },
  });
  return categories
    .map((category) => {
      const parent = category.parentCategory ? `${category.parentCategory.name} › ` : "";
      const inactive = category.isActive ? "" : " (inactive)";
      return {
        id: category.id,
        name: category.name,
        label: `${parent}${category.name}${inactive}`,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function getVarietyNames(): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { variety: { not: null } },
    distinct: ["variety"],
    select: { variety: true },
    orderBy: { variety: "asc" },
  });
  return rows.flatMap((row) => (row.variety ? [row.variety] : []));
}
