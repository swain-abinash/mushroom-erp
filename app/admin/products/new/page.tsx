import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getCategoryOptions, getVarietyNames } from "../category-options";
import { ProductForm } from "../product-form";

export const metadata: Metadata = { title: "New product — SporeERP Admin" };

export default async function NewProductPage() {
  await requirePermission(PERMISSIONS.CATALOG_PRODUCT_MANAGE, "/admin/products/new");
  const [categories, varieties] = await Promise.all([getCategoryOptions(), getVarietyNames()]);

  return (
    <div className="flex max-w-4xl flex-col gap-6 font-body">
      <header>
        <Link href="/admin/products" className="text-sm text-spore-ivory/60 hover:underline">
          ← Products
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold">New product</h1>
      </header>
      {categories.length === 0 ? (
        <p className="rounded-lg bg-warning-amber/10 px-3 py-2 text-sm text-warning-amber">
          Create a category first under{" "}
          <Link href="/admin/categories" className="underline">
            Categories
          </Link>
          .
        </p>
      ) : (
        // Setting prices on a new product is part of catalog:product:manage; only changing the
        // prices of an existing product needs catalog:pricing:override.
        <ProductForm categories={categories} varieties={varieties} canOverridePricing />
      )}
    </div>
  );
}
