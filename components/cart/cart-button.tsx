"use client";

import { useCart } from "@/context/cart-context";

export function CartButton() {
  const { itemCount, openDrawer } = useCart();

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative flex size-9 items-center justify-center rounded-full border border-forest-primary/20 dark:border-white/15 text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/10 transition-colors cursor-pointer shrink-0"
      aria-label={`Open Cart with ${itemCount} items`}
    >
      <span className="text-lg">🛒</span>
      {itemCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-forest-primary font-data text-xs font-bold text-spore-ivory shadow-xs animate-in zoom-in-50 duration-150">
          {itemCount}
        </span>
      )}
    </button>
  );
}
