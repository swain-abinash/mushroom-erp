import type { ProductStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const STYLES: Record<ProductStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-spore-ivory/10 text-spore-ivory/70" },
  PUBLISHED: { label: "Published", className: "bg-success-mint/15 text-success-mint" },
  OUT_OF_STOCK: { label: "Out of stock", className: "bg-warning-amber/15 text-warning-amber" },
  ARCHIVED: { label: "Archived", className: "bg-alert-coral/15 text-alert-coral" },
};

export function StatusBadge({ status }: { status: ProductStatus }) {
  const style = STYLES[status];
  return (
    <span
      className={cn("rounded-full px-2.5 py-0.5 font-body text-xs font-semibold", style.className)}
    >
      {style.label}
    </span>
  );
}
