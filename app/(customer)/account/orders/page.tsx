import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { OrderService } from "@/services/order.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UNIT_LABELS } from "@/lib/catalog/format";

export const instant = false;
export const metadata = {
  title: "My Orders — SporeERP",
};

export default async function CustomerOrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await OrderService.listCustomerOrders(user.id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 font-body text-forest-primary dark:text-spore-ivory">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-forest-primary/60 dark:text-spore-ivory/60 mb-2">
            <Link href="/account" className="hover:underline">
              My account
            </Link>{" "}
            / Orders
          </nav>
          <h1 className="font-display text-3xl font-bold">My Harvest Orders</h1>
          <p className="text-sm text-forest-primary/70 dark:text-spore-ivory/70 mt-1">
            Track your farm-fresh mushroom deliveries and past invoices
          </p>
        </div>
        <Link
          href="/products"
          className="rounded-full bg-forest-primary px-6 py-2.5 font-display text-sm font-semibold text-spore-ivory hover:bg-forest-hover"
        >
          + Order Fresh Harvest
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-3xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-12 text-center">
          <span className="text-5xl mb-3 block">📦</span>
          <h2 className="font-display text-xl font-bold">No orders placed yet</h2>
          <p className="mt-1 text-sm text-forest-primary/70 dark:text-spore-ivory/70 max-w-sm mx-auto">
            You haven&apos;t ordered fresh mushrooms yet. Start your journey with our dawn harvest!
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-full bg-forest-primary px-8 py-3 font-display text-sm font-semibold text-spore-ivory hover:bg-forest-hover"
          >
            Browse Today&apos;s Harvest
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusColors: Record<string, string> = {
              CONFIRMED: "bg-success-mint/15 text-green-700 dark:text-success-mint",
              PROCESSING: "bg-warning-amber/15 text-amber-700 dark:text-warning-amber",
              PACKED: "bg-shiitake-ochre/15 text-amber-800 dark:text-shiitake-ochre",
              OUT_FOR_DELIVERY: "bg-forest-primary/15 text-forest-primary dark:text-spore-ivory",
              DELIVERED: "bg-success-mint/20 text-green-700 dark:text-success-mint",
              CANCELLED: "bg-alert-coral/15 text-red-600 dark:text-alert-coral",
              REFUNDED: "bg-alert-coral/15 text-red-600 dark:text-alert-coral",
            };

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest-primary/10 dark:border-white/15 pb-4">
                  <div>
                    <span className="font-data font-bold text-base text-forest-primary dark:text-spore-ivory">
                      {order.orderNumber}
                    </span>
                    <span className="text-xs text-forest-primary/60 dark:text-spore-ivory/60 ml-3">
                      Placed on {formatDate(order.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                        statusColors[order.orderStatus] ?? "bg-forest-primary/10 text-forest-primary"
                      }`}
                    >
                      {order.orderStatus.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-semibold text-forest-primary/70 dark:text-spore-ivory/70">
                      {order.paymentStatus === "PAID" ? "Paid" : "Pay on Delivery"}
                    </span>
                  </div>
                </div>

                <div className="py-4 space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs text-forest-primary/80 dark:text-spore-ivory/80">
                    <span className="font-semibold text-forest-primary dark:text-spore-ivory">Items:</span>
                    {order.items.map((item, idx) => (
                      <span key={item.id}>
                        {item.product.name} ({Number(item.quantity)}{" "}
                        {UNIT_LABELS[item.product.unitType]?.short ?? "unit"})
                        {idx < order.items.length - 1 ? ", " : ""}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-forest-primary/60 dark:text-spore-ivory/60">
                    Slot:{" "}
                    {order.deliverySlot === "MORNING_HARVEST_DISPATCH"
                      ? "🌅 Morning Dispatch (8–11 AM)"
                      : "🌆 Evening Dispatch (4–7 PM)"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-forest-primary/10 dark:border-white/15 pt-4 text-sm">
                  <div>
                    <span className="text-xs text-forest-primary/60 dark:text-spore-ivory/60">Total: </span>
                    <span className="font-data font-bold text-base text-forest-primary dark:text-spore-ivory">
                      {formatCurrency(Number(order.totalAmount))}
                    </span>
                  </div>

                  <Link
                    href={`/checkout/success/${order.orderNumber}`}
                    className="text-xs font-semibold text-forest-primary dark:text-spore-ivory underline hover:text-forest-hover"
                  >
                    View Receipt & Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
