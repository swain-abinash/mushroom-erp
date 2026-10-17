import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerType } from "@prisma/client";
import { AvailabilityBadge } from "@/components/catalog/product-card";
import { getStorefrontProduct, type ProductDetailDTO } from "@/lib/catalog/queries";
import { UNIT_LABELS } from "@/lib/catalog/format";
import { appUrl } from "@/lib/url";
import { formatCurrency } from "@/lib/utils";
import { InfoTabs, NotifyMeForm, ProductGallery, QuantitySelector } from "./product-interactive";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getStorefrontProduct((await params).slug);
  if (!product) return { title: "Product not found — SporeERP" };

  const description =
    product.shortDescription ?? product.description.replace(/\s+/g, " ").slice(0, 160);
  const images = product.images.slice(0, 4).map((image) => ({ url: image.url, alt: image.alt }));
  return {
    title: `${product.name} — SporeERP`,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: `/products/${product.slug}`,
      images,
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title: product.name,
      description,
    },
  };
}

function productJsonLd(product: ProductDetailDTO) {
  const url = appUrl(`/products/${product.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDescription ?? product.description,
    category: product.category.name,
    image: product.images.map((image) => appUrl(image.url)),
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: product.retailPrice.toFixed(2),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : product.allowBackorder
          ? "https://schema.org/BackOrder"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

const TIER_LABELS: Partial<Record<CustomerType, string>> = {
  B2B_RESTAURANT: "Restaurants",
  WHOLESALE: "Wholesale",
};

export default async function ProductPage({ params }: Props) {
  const product = await getStorefrontProduct((await params).slug);
  if (!product) notFound();

  const unit = UNIT_LABELS[product.unitType].short;
  const canOrder = product.inStock || product.allowBackorder;
  const tabs = [
    { id: "description", label: "Description", content: product.description },
    ...(product.nutritionInfo
      ? [{ id: "nutrition", label: "Nutritional profile", content: product.nutritionInfo }]
      : []),
    ...(product.storageTips
      ? [{ id: "storage", label: "Cooking & storage", content: product.storageTips }]
      : []),
  ];

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12 text-forest-primary">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c"),
        }}
      />

      <nav aria-label="Breadcrumb" className="font-body text-sm text-forest-primary/60">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        {" / "}
        <Link href={`/products?category=${product.category.slug}`} className="hover:underline">
          {product.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-forest-primary/10 px-2.5 py-0.5 font-body text-xs font-semibold">
                {product.category.name}
              </span>
              {product.variety ? (
                <span className="rounded-full bg-shiitake-ochre/15 px-2.5 py-0.5 font-body text-xs font-semibold text-shiitake-ochre">
                  {product.variety}
                </span>
              ) : null}
              <AvailabilityBadge product={product} />
            </div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{product.name}</h1>
            <p className="font-data text-xs text-forest-primary/60">SKU {product.sku}</p>
          </div>

          <p className="font-data">
            <span className="text-3xl font-bold">{formatCurrency(product.retailPrice)}</span>
            <span className="text-forest-primary/60"> / {unit}</span>
            {product.minOrderQty > 1 ? (
              <span className="block font-body text-sm text-forest-primary/60">
                Minimum order {product.minOrderQty} {unit}
              </span>
            ) : null}
          </p>

          {product.shortDescription ? (
            <p className="font-body text-forest-primary/80">{product.shortDescription}</p>
          ) : null}

          <div className="flex gap-3 rounded-2xl bg-success-mint/10 p-4 font-body text-sm">
            <span aria-hidden>🌱</span>
            <p>
              <span className="font-semibold">Freshness guarantee</span> — harvested at dawn and
              dispatched the same day. Best within {product.shelfLifeDays}{" "}
              {product.shelfLifeDays === 1 ? "day" : "days"} of delivery.
            </p>
          </div>

          {canOrder ? (
            <QuantitySelector
              min={product.minOrderQty}
              step={product.unitType === "KG" ? 0.5 : 1}
              max={product.inStock && !product.allowBackorder ? product.availableStock : null}
              unitLabel={unit}
              canOrder={canOrder}
              productInfo={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                sku: product.sku,
                price: product.retailPrice,
                unitType: product.unitType,
                imageUrl: product.images[0]?.url ?? null,
              }}
            />
          ) : (
            <NotifyMeForm productId={product.id} />
          )}

          {product.pricingTiers.length ? (
            <div className="rounded-2xl border border-forest-primary/10 p-4 font-body text-sm">
              <p className="mb-2 font-display font-semibold">👨‍🍳 Business pricing</p>
              <ul className="flex flex-col gap-1">
                {product.pricingTiers.map((tier) => (
                  <li key={tier.customerType}>
                    {TIER_LABELS[tier.customerType] ?? tier.customerType}:{" "}
                    <span className="font-data font-semibold">{formatCurrency(tier.price)}</span> /{" "}
                    {unit}
                    {tier.minQty > 1 ? ` from ${tier.minQty} ${unit}` : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-forest-primary/60">
                Applies to approved business accounts.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <InfoTabs tabs={tabs} />
    </article>
  );
}
