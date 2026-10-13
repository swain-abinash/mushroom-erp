import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/catalog/status-badge";
import { hasPermission, requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { getProductForEdit } from "@/services/catalog.service";
import { getCategoryOptions, getVarietyNames } from "../category-options";
import { ProductForm } from "../product-form";
import { ArchiveProductForm } from "./archive-form";

export const metadata: Metadata = { title: "Edit product — SporeERP Admin" };

const SAVED_MESSAGES: Record<string, string> = {
  created: "Product created.",
  updated: "Changes saved.",
  archived: "Product archived — it is no longer shown on the storefront.",
};

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const user = await requirePermission(PERMISSIONS.CATALOG_PRODUCT_MANAGE, `/admin/products/${id}`);
  const [product, categories, varieties] = await Promise.all([
    getProductForEdit(id),
    getCategoryOptions(),
    getVarietyNames(),
  ]);
  if (!product) notFound();

  const visible = product.status === "PUBLISHED" || product.status === "OUT_OF_STOCK";

  return (
    <div className="flex max-w-4xl flex-col gap-6 font-body">
      <header className="flex flex-col gap-2">
        <Link href="/admin/products" className="text-sm text-spore-ivory/60 hover:underline">
          ← Products
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold">{product.name}</h1>
          <StatusBadge status={product.status} />
        </div>
        <p className="font-data text-xs text-spore-ivory/60">
          {product.sku} ·{" "}
          {visible ? (
            <Link href={`/products/${product.slug}`} className="underline" target="_blank">
              /products/{product.slug}
            </Link>
          ) : (
            `/products/${product.slug} (not visible on the storefront)`
          )}
        </p>
      </header>

      {saved && SAVED_MESSAGES[saved] ? (
        <p
          role="status"
          className="rounded-lg bg-success-mint/10 px-3 py-2 text-sm text-success-mint"
        >
          {SAVED_MESSAGES[saved]}
        </p>
      ) : null}

      <ProductForm
        // Remount after a save so radio/checkbox defaults reflect the stored images and status.
        key={product.images.map((image) => image.id).join() + product.status}
        product={product}
        categories={categories}
        varieties={varieties}
        canOverridePricing={hasPermission(user, PERMISSIONS.CATALOG_PRICING_OVERRIDE)}
      />

      {product.status !== "ARCHIVED" ? (
        <section className="rounded-2xl border border-alert-coral/30 p-6">
          <h2 className="mb-2 font-display text-lg font-bold">Remove from sale</h2>
          <p className="mb-4 text-sm text-spore-ivory/70">
            Products are archived rather than deleted so past orders keep their history.
          </p>
          <ArchiveProductForm productId={product.id} />
        </section>
      ) : null}
    </div>
  );
}
