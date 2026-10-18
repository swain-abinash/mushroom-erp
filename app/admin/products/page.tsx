import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductStatus } from "@prisma/client";
import { StatusBadge } from "@/components/catalog/status-badge";
import { hasPermission, requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { UNIT_LABELS } from "@/lib/catalog/format";
import { formatCurrency } from "@/lib/utils";
import { listProductsForAdmin } from "@/services/catalog.service";
import { getCategoryOptions } from "./category-options";

export const instant = false;
export const metadata: Metadata = { title: "Products — SporeERP Admin" };

const controlClass =
  "rounded-lg border border-spore-ivory/20 bg-transparent px-3 py-2 text-sm [&>option]:text-charcoal-dark";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string }>;
}) {
  const [user, params] = await Promise.all([
    requirePermission(PERMISSIONS.CATALOG_PRODUCT_VIEW, "/admin/products"),
    searchParams,
  ]);
  const canManage = hasPermission(user, PERMISSIONS.CATALOG_PRODUCT_MANAGE);
  const status = Object.values(ProductStatus).find((value) => value === params.status);
  const [products, categories] = await Promise.all([
    listProductsForAdmin({
      q: params.q?.trim() || undefined,
      categoryId: params.category || undefined,
      status,
    }),
    getCategoryOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6 font-body">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="mt-1 text-sm text-spore-ivory/70">{products.length} products</p>
        </div>
        {canManage ? (
          <Link
            href="/admin/products/new"
            className="rounded-full bg-spore-ivory px-5 py-2.5 font-display text-sm font-semibold text-forest-primary"
          >
            + New product
          </Link>
        ) : null}
      </header>

      <form className="flex flex-wrap gap-3" role="search">
        <input
          name="q"
          defaultValue={params.q}
          placeholder="Search name, SKU or variety"
          className={controlClass}
        />
        <select name="category" defaultValue={params.category ?? ""} className={controlClass}>
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className={controlClass}>
          <option value="">All statuses</option>
          {Object.values(ProductStatus).map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ").toLowerCase()}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg border border-spore-ivory/20 px-4 py-2 text-sm">
          Filter
        </button>
      </form>

      <section className="overflow-x-auto rounded-2xl border border-spore-ivory/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-charcoal text-xs uppercase tracking-wide text-spore-ivory/60">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Retail price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spore-ivory/10">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-spore-ivory/60">
                  No products match these filters.
                </td>
              </tr>
            ) : null}
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  <Link
                    href={canManage ? `/admin/products/${product.id}` : `/products/${product.slug}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    {product.primaryImage ? (
                      <Image
                        src={product.primaryImage.imageUrl}
                        alt={product.primaryImage.altText ?? product.name}
                        width={44}
                        height={44}
                        className="size-11 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid size-11 place-items-center rounded-lg bg-surface-charcoal">
                        🍄
                      </span>
                    )}
                    <span>
                      <span className="block font-semibold">
                        {product.name}
                        {product.isFeatured ? (
                          <span className="ml-2 text-xs text-shiitake-ochre">★ Featured</span>
                        ) : null}
                      </span>
                      <span className="font-data text-xs text-spore-ivory/60">{product.sku}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {product.category.name}
                  {product.variety ? (
                    <div className="text-xs text-spore-ivory/60">{product.variety}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 font-data">
                  {formatCurrency(product.retailPrice)}
                  <span className="text-xs text-spore-ivory/60">
                    {" "}
                    / {UNIT_LABELS[product.unitType].short}
                  </span>
                </td>
                <td className="px-4 py-3 font-data">
                  <span className={product.lowStock ? "text-warning-amber" : undefined}>
                    {product.stock ?? 0}
                  </span>
                  {product.lowStock ? (
                    <div className="font-body text-xs text-warning-amber">Low stock</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={product.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
