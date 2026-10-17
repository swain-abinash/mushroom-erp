import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import {
  getStorefrontCategories,
  getVarieties,
  listStorefrontProducts,
} from "@/lib/catalog/queries";
import { cn } from "@/lib/utils";

export const instant = false;
export const metadata: Metadata = {
  title: "Shop fresh mushrooms — SporeERP",
  description:
    "Fresh oyster, milky and paddy straw mushrooms harvested daily, plus dried mushrooms, powders and cultivation supplies.",
  alternates: { canonical: "/products" },
};

type Params = { category?: string; variety?: string; inStock?: string; q?: string; page?: string };

function hrefWith(params: Params, changes: Partial<Params>): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, page: undefined, ...changes })) {
    if (value) next.set(key, value);
  }
  const query = next.toString();
  return query ? `/products?${query}` : "/products";
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "block rounded-lg px-3 py-1.5 font-body text-sm",
        active
          ? "bg-forest-primary font-semibold text-spore-ivory"
          : "text-forest-primary hover:bg-forest-primary/5",
      )}
    >
      {children}
    </Link>
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const [{ products, total, pageCount, page: currentPage }, categories, varieties] =
    await Promise.all([
      listStorefrontProducts({
        category: params.category,
        variety: params.variety,
        inStock: params.inStock === "1",
        q: params.q?.trim() || undefined,
        page,
        limit: 24,
      }),
      getStorefrontCategories(),
      getVarieties(),
    ]);

  const topLevel = categories.filter((category) => !category.parentId);
  const hasFilters = Boolean(params.category || params.variety || params.inStock || params.q);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:flex-row">
      <aside className="flex shrink-0 flex-col gap-6 lg:w-56">
        <form action="/products" role="search">
          {params.category ? <input type="hidden" name="category" value={params.category} /> : null}
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search mushrooms…"
            aria-label="Search products"
            className="w-full rounded-lg border border-forest-primary/20 bg-surface-white px-3 py-2 font-body text-sm text-forest-primary"
          />
        </form>

        <nav aria-label="Categories" className="flex flex-col gap-1">
          <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-forest-primary/60">
            Category
          </h2>
          <FilterLink href={hrefWith(params, { category: undefined })} active={!params.category}>
            All products
          </FilterLink>
          {topLevel.map((category) => (
            <div key={category.slug}>
              <FilterLink
                href={hrefWith(params, { category: category.slug })}
                active={params.category === category.slug}
              >
                {category.name}
              </FilterLink>
              {categories
                .filter((child) => child.parentId === category.id)
                .map((child) => (
                  <div key={child.slug} className="pl-3">
                    <FilterLink
                      href={hrefWith(params, { category: child.slug })}
                      active={params.category === child.slug}
                    >
                      {child.name}
                    </FilterLink>
                  </div>
                ))}
            </div>
          ))}
        </nav>

        {varieties.length ? (
          <nav aria-label="Varieties" className="flex flex-col gap-1">
            <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-forest-primary/60">
              Variety
            </h2>
            {varieties.map((variety) => (
              <FilterLink
                key={variety.name}
                href={hrefWith(params, {
                  variety: params.variety === variety.name ? undefined : variety.name,
                })}
                active={params.variety === variety.name}
              >
                {variety.name}
              </FilterLink>
            ))}
          </nav>
        ) : null}

        <div className="flex flex-col gap-1">
          <h2 className="mb-1 font-display text-sm font-bold uppercase tracking-wide text-forest-primary/60">
            Availability
          </h2>
          <FilterLink
            href={hrefWith(params, { inStock: params.inStock ? undefined : "1" })}
            active={params.inStock === "1"}
          >
            In stock only
          </FilterLink>
        </div>
      </aside>

      <section className="flex flex-1 flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="font-display text-3xl font-bold text-forest-primary">
            {params.variety ??
              categories.find((category) => category.slug === params.category)?.name ??
              "All products"}
          </h1>
          <p className="font-body text-sm text-forest-primary/60">
            {total} {total === 1 ? "product" : "products"}
            {hasFilters ? (
              <>
                {" · "}
                <Link href="/products" className="underline">
                  Clear filters
                </Link>
              </>
            ) : null}
          </p>
        </header>

        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-forest-primary/20 p-10 text-center font-body text-forest-primary/60">
            No products match these filters.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 3} />
            ))}
          </div>
        )}

        {pageCount > 1 ? (
          <nav
            aria-label="Pagination"
            className="flex items-center justify-center gap-4 font-body text-sm text-forest-primary"
          >
            {currentPage > 1 ? (
              <Link
                href={hrefWith(params, { page: String(currentPage - 1) })}
                className="underline"
              >
                ← Previous
              </Link>
            ) : null}
            <span>
              Page {currentPage} of {pageCount}
            </span>
            {currentPage < pageCount ? (
              <Link
                href={hrefWith(params, { page: String(currentPage + 1) })}
                className="underline"
              >
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
