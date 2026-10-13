import Image from "next/image";
import Link from "next/link";
import type { ProductCardDTO } from "@/lib/catalog/queries";
import { UNIT_LABELS } from "@/lib/catalog/format";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function AvailabilityBadge({
  product,
  className,
}: {
  product: Pick<ProductCardDTO, "inStock" | "allowBackorder" | "availableStock" | "unitType">;
  className?: string;
}) {
  const [label, style] = product.inStock
    ? product.availableStock <= 5
      ? [
          `Only ${product.availableStock} ${UNIT_LABELS[product.unitType].short} left`,
          "bg-warning-amber/15 text-warning-amber",
        ]
      : ["In stock", "bg-success-mint/15 text-success-mint"]
    : product.allowBackorder
      ? ["Available on back-order", "bg-shiitake-ochre/15 text-shiitake-ochre"]
      : ["Out of stock", "bg-alert-coral/10 text-alert-coral"];

  return (
    <span
      className={cn("rounded-full px-2.5 py-0.5 font-body text-xs font-semibold", style, className)}
    >
      {label}
    </span>
  );
}

export function ProductImage({
  image,
  sizes,
  priority,
  className,
}: {
  image: { url: string; alt: string } | null;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-forest-primary/5", className)}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-5xl" aria-hidden>
          🍄
        </span>
      )}
    </div>
  );
}

export function ProductCard({
  product,
  priority,
}: {
  product: ProductCardDTO;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-forest-primary/10 bg-surface-white transition-shadow hover:shadow-md"
    >
      <ProductImage
        image={product.primaryImage}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        priority={priority}
        className={cn("aspect-square", !product.inStock && !product.allowBackorder && "opacity-70")}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-body text-xs uppercase tracking-wide text-forest-primary/60">
            {product.variety ?? product.category.name}
          </span>
          <AvailabilityBadge product={product} />
        </div>
        <h3 className="font-display text-lg font-bold text-forest-primary group-hover:underline">
          {product.name}
        </h3>
        {product.shortDescription ? (
          <p className="line-clamp-2 font-body text-sm text-forest-primary/70">
            {product.shortDescription}
          </p>
        ) : null}
        <p className="mt-auto font-data text-forest-primary">
          <span className="text-lg font-bold">{formatCurrency(product.retailPrice)}</span>
          <span className="text-sm text-forest-primary/60">
            {" "}
            / {UNIT_LABELS[product.unitType].short}
          </span>
        </p>
      </div>
    </Link>
  );
}
