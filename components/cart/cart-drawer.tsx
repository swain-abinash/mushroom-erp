"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";
import { UNIT_LABELS } from "@/lib/catalog/format";

export function CartDrawer() {
  const {
    items,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    subtotal,
    deliveryFee,
    freeDeliveryThreshold,
    total,
  } = useCart();

  if (!isDrawerOpen) return null;

  const freeDeliveryProgress = Math.min(100, (subtotal / freeDeliveryThreshold) * 100);
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="flex-1" onClick={closeDrawer} aria-label="Close backdrop" />

      <aside
        className="flex h-full w-full max-w-md flex-col bg-surface-white shadow-2xl transition-transform animate-in slide-in-from-right duration-300 font-body"
        role="dialog"
        aria-label="Shopping Cart Drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-forest-primary/10 dark:border-white/15 px-6 py-4 bg-stone-100 dark:bg-spore-ivory/50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🍄</span>
            <h2 className="font-display text-lg font-bold text-forest-primary dark:text-spore-ivory">
              Fresh Harvest Basket
            </h2>
            <span className="rounded-full bg-forest-primary/10 px-2 py-0.5 text-xs font-semibold text-forest-primary dark:text-spore-ivory">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-full p-2 text-forest-primary/60 dark:text-spore-ivory/60 hover:bg-forest-primary/10 hover:text-forest-primary dark:hover:text-spore-ivory transition-colors"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Free Delivery Banner */}
        <div className="bg-forest-primary/5 px-6 py-3 border-b border-forest-primary/10 dark:border-white/15">
          <div className="flex justify-between text-xs font-semibold text-forest-primary dark:text-spore-ivory">
            <span>
              {amountToFreeDelivery > 0
                ? `Add ${formatCurrency(amountToFreeDelivery)} more for FREE Delivery`
                : "🎉 You have earned FREE Delivery!"}
            </span>
            <span>{Math.round(freeDeliveryProgress)}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-forest-primary/20 overflow-hidden">
            <div
              className="h-full bg-success-mint transition-all duration-300 rounded-full"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center gap-4 py-12">
              <span className="text-6xl">🧺</span>
              <div className="space-y-1">
                <p className="font-display text-lg font-bold text-forest-primary dark:text-spore-ivory">
                  Your basket is empty
                </p>
                <p className="text-sm text-forest-primary/60 dark:text-spore-ivory/60 max-w-xs">
                  Discover fresh, hand-harvested organic mushrooms grown with zero chemicals.
                </p>
              </div>
              <Link
                href="/products"
                onClick={closeDrawer}
                className="mt-2 rounded-full bg-forest-primary px-6 py-2.5 font-display text-sm font-semibold text-spore-ivory hover:bg-forest-hover transition-colors"
              >
                Browse Harvest Catalog
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const unit = UNIT_LABELS[item.unitType]?.short ?? "unit";
              const step = item.unitType === "KG" ? 0.5 : 1;
              return (
                <div
                  key={item.productId}
                  className="flex gap-4 rounded-xl border border-forest-primary/10 dark:border-white/15 p-3 bg-stone-100 dark:bg-spore-ivory/20 hover:border-forest-primary/20 dark:hover:border-white/15 transition-colors"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-forest-primary/5">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <span className="absolute inset-0 grid place-items-center text-3xl">🍄</span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeDrawer}
                          className="font-display text-sm font-bold text-forest-primary dark:text-spore-ivory hover:underline line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-forest-primary/40 dark:text-spore-ivory/40 hover:text-red-600 dark:hover:text-alert-coral text-xs transition-colors"
                          title="Remove item"
                        >
                          🗑
                        </button>
                      </div>
                      <p className="text-xs text-forest-primary/60 dark:text-spore-ivory/60">
                        {formatCurrency(item.price)} / {unit}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center rounded-full border border-forest-primary/20 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity - step)}
                          className="size-7 rounded-full text-base font-bold text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/5 disabled:opacity-30"
                          disabled={item.quantity <= item.minOrderQty}
                        >
                          −
                        </button>
                        <span className="min-w-12 text-center text-xs font-semibold text-forest-primary dark:text-spore-ivory font-data">
                          {item.quantity} {unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, item.quantity + step)}
                          className="size-7 rounded-full text-base font-bold text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/5 disabled:opacity-30"
                          disabled={item.maxStock !== null && item.quantity + step > item.maxStock}
                        >
                          +
                        </button>
                      </div>
                      <span className="font-data text-sm font-bold text-forest-primary dark:text-spore-ivory">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="border-t border-forest-primary/10 dark:border-white/15 bg-stone-100 dark:bg-spore-ivory/40 p-6 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-forest-primary/70 dark:text-spore-ivory/70">
                <span>Subtotal</span>
                <span className="font-data font-semibold text-forest-primary dark:text-spore-ivory">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-forest-primary/70 dark:text-spore-ivory/70">
                <span>Delivery Fee</span>
                <span className="font-data font-semibold text-forest-primary dark:text-spore-ivory">
                  {deliveryFee === 0 ? (
                    <span className="text-green-700 dark:text-success-mint font-bold uppercase text-xs">FREE</span>
                  ) : (
                    formatCurrency(deliveryFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-forest-primary dark:text-spore-ivory pt-2 border-t border-forest-primary/10 dark:border-white/15">
                <span>Estimated Total</span>
                <span className="font-data text-lg text-forest-primary dark:text-spore-ivory">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-surface-white dark:bg-surface-charcoal p-2.5 border border-forest-primary/10 dark:border-white/15 flex items-center gap-2.5 text-xs text-forest-primary/80 dark:text-spore-ivory/80">
              <span className="text-base">🌅</span>
              <span>
                Harvested at 5:00 AM on dispatch day. 100% farm fresh guarantee.
              </span>
            </div>

            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-forest-primary py-3.5 font-display text-sm font-bold text-spore-ivory shadow-md hover:bg-forest-hover transition-all text-center"
            >
              <span>Proceed to Checkout</span>
              <span>→</span>
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
