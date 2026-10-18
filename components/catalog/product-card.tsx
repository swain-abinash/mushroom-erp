import Image from "next/image";
import Link from "next/link";
import type { ProductCardDTO } from "@/lib/catalog/queries";
import { UNIT_LABELS } from "@/lib/catalog/format";
import { formatCurrency, cn } from "@/lib/utils";

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
          "bg-warning-amber/15 text-warning-amber border-warning-amber/20",
        ]
      : ["Fresh in stock", "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"]
    : product.allowBackorder
      ? ["Available on back-order", "bg-shiitake-ochre/15 text-shiitake-ochre border-shiitake-ochre/20"]
      : ["Sold out for today", "bg-alert-coral/10 text-alert-coral border-alert-coral/20"];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-body text-[11px] font-semibold",
        style,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      <span>{label}</span>
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
    <div className={cn("relative overflow-hidden bg-forest-primary/5 dark:bg-white/5", className)}>
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
      ) : (
        <span
          className="absolute inset-0 grid place-items-center text-5xl transition-transform duration-500 group-hover:scale-110"
          aria-hidden
        >
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
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/90 dark:bg-surface-charcoal/90 backdrop-blur-md shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-forest-primary/30 dark:hover:border-success-mint/40"
    >
      <div className="relative">
        <ProductImage
          image={product.primaryImage}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className={cn("aspect-square", !product.inStock && !product.allowBackorder && "opacity-60")}
        />

        {/* Floating Farm-Fresh pill */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/90 dark:bg-[#121c17]/90 px-2.5 py-0.5 text-[10px] font-bold text-forest-primary dark:text-spore-ivory shadow-xs backdrop-blur-md border border-black/5 dark:border-white/10">
            <span>🌿</span>
            <span>Farm Direct</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-body text-[11px] uppercase font-bold tracking-wider text-shiitake-ochre">
            {product.variety ?? product.category.name}
          </span>
          <AvailabilityBadge product={product} />
        </div>

        <h3 className="font-display text-lg font-bold text-forest-primary dark:text-spore-ivory transition-colors group-hover:text-forest-hover dark:group-hover:text-success-mint">
          {product.name}
        </h3>

        {product.shortDescription ? (
          <p className="line-clamp-2 font-body text-xs text-forest-primary/70 dark:text-spore-ivory/60 leading-relaxed">
            {product.shortDescription}
          </p>
        ) : null}

        <div className="mt-auto pt-3 border-t border-stone-200/60 dark:border-white/10 flex items-center justify-between">
          <p className="font-data text-forest-primary dark:text-spore-ivory">
            <span className="text-xl font-extrabold">{formatCurrency(product.retailPrice)}</span>
            <span className="text-xs text-forest-primary/60 dark:text-spore-ivory/50 font-medium">
              {" "}
              / {UNIT_LABELS[product.unitType].short}
            </span>
          </p>

          <span className="flex size-8 items-center justify-center rounded-full bg-forest-primary/10 dark:bg-white/10 text-forest-primary dark:text-spore-ivory transition-all group-hover:bg-forest-primary group-hover:text-spore-ivory dark:group-hover:bg-success-mint dark:group-hover:text-surface-charcoal group-hover:scale-105 shadow-2xs">
            +
          </span>
        </div>
      </div>
    </Link>
  );
}
