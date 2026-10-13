import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { listCategoriesForAdmin } from "@/services/catalog.service";
import { CategoryForm } from "./category-form";

export const metadata: Metadata = { title: "Categories — SporeERP Admin" };

export default async function CategoriesPage() {
  await requirePermission(PERMISSIONS.CATALOG_PRODUCT_MANAGE, "/admin/categories");
  const categories = await listCategoriesForAdmin();
  const parents = categories.filter((category) => !category.parentId);

  return (
    <div className="flex max-w-4xl flex-col gap-8 font-body">
      <header>
        <h1 className="font-display text-2xl font-bold">Categories</h1>
        <p className="mt-1 text-sm text-spore-ivory/70">
          Two levels deep, e.g. Processed Products › Dry Mushrooms. Renaming keeps the storefront
          URL.
        </p>
      </header>

      <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6">
        <h2 className="mb-4 font-display text-lg font-bold">New category</h2>
        {/* React resets the fields after a successful create, while the success message stays. */}
        <CategoryForm parents={parents} />
      </section>

      <section className="flex flex-col gap-4">
        {categories.map((category) => (
          <details
            key={category.id}
            className="rounded-2xl border border-spore-ivory/10 p-4 open:bg-surface-charcoal"
          >
            <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
              <span>
                <span className="font-semibold">
                  {category.parentCategory ? `${category.parentCategory.name} › ` : ""}
                  {category.name}
                </span>
                <span className="ml-2 font-data text-xs text-spore-ivory/60">/{category.slug}</span>
              </span>
              <span className="text-xs text-spore-ivory/60">
                {category._count.products} products
                {category._count.subCategories
                  ? ` · ${category._count.subCategories} sub-categories`
                  : ""}
                {category.isActive ? "" : " · inactive"}
              </span>
            </summary>
            <div className="mt-4">
              <CategoryForm category={category} parents={parents} />
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
