import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { OrderService } from "@/services/order.service";
import { formatCurrency } from "@/lib/utils";
import { UNIT_LABELS } from "@/lib/catalog/format";

export const instant = false;
export const metadata = {
  title: "Order Confirmed — SporeERP",
};

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();

  let order;
  try {
    order = await OrderService.getOrder(orderNumber, user?.id);
  } catch {
    notFound();
  }

  const address = order.deliveryAddressJson as {
    recipientName?: string;
    recipientPhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 font-body">
      <div className="rounded-3xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-8 shadow-sm text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-success-mint/15 text-4xl mb-4">
          ✨
        </div>

        <span className="rounded-full bg-forest-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-forest-primary dark:text-spore-ivory">
          Order Confirmed
        </span>

        <h1 className="mt-3 font-display text-3xl font-bold text-forest-primary dark:text-spore-ivory sm:text-4xl">
          Harvest Scheduled!
        </h1>
        <p className="mt-2 text-sm text-forest-primary/70 dark:text-spore-ivory/70">
          Thank you for choosing local, organic mushrooms. We have received your order{" "}
          <strong className="text-forest-primary dark:text-spore-ivory">{order.orderNumber}</strong>.
        </p>

        {/* Dispatch details card */}
        <div className="mt-8 rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-stone-100 dark:bg-spore-ivory/30 p-6 text-left space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-forest-primary/10 dark:border-white/15 pb-4">
            <div>
              <p className="text-xs uppercase font-semibold text-forest-primary/60 dark:text-spore-ivory/60">Dispatch Window</p>
              <p className="text-sm font-bold text-forest-primary dark:text-spore-ivory">
                {order.deliverySlot === "MORNING_HARVEST_DISPATCH"
                  ? "🌅 Morning Harvest Dispatch (8:00 AM – 11:00 AM)"
                  : "🌆 Evening Dispatch (4:00 PM – 7:00 PM)"}
              </p>
            </div>
            <span className="rounded-full bg-success-mint/15 px-3 py-1 text-xs font-bold text-green-700 dark:text-success-mint">
              CONFIRMED
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-xs uppercase font-semibold text-forest-primary/60 dark:text-spore-ivory/60 mb-1">
                Delivery Address
              </p>
              <p className="font-semibold text-forest-primary dark:text-spore-ivory">{address.recipientName}</p>
              <p className="text-forest-primary/80 dark:text-spore-ivory/80 text-xs mt-0.5">
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city},{" "}
                {address.state} — {address.pincode}
              </p>
              <p className="text-xs text-forest-primary/60 dark:text-spore-ivory/60 mt-1">📞 {address.recipientPhone}</p>
            </div>

            <div>
              <p className="text-xs uppercase font-semibold text-forest-primary/60 dark:text-spore-ivory/60 mb-1">
                Payment Details
              </p>
              <p className="font-semibold text-forest-primary dark:text-spore-ivory">
                {order.payments[0]?.method?.replace(/_/g, " ") ?? "Payment"}
              </p>
              <p className="text-xs text-forest-primary/80 dark:text-spore-ivory/80 mt-0.5">
                Status:{" "}
                <span className="font-bold">
                  {order.paymentStatus === "PAID" ? "Paid Online" : "Due on Fresh Delivery"}
                </span>
              </p>
              <p className="text-sm font-data font-bold text-forest-primary dark:text-spore-ivory mt-2">
                Total: {formatCurrency(Number(order.totalAmount))}
              </p>
            </div>
          </div>
        </div>

        {/* Ordered Items Breakdown */}
        <div className="mt-8 text-left">
          <h2 className="font-display text-base font-bold text-forest-primary dark:text-spore-ivory mb-3">
            Harvest Items
          </h2>
          <div className="divide-y divide-forest-primary/10 dark:divide-white/15 rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal px-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-3 text-sm">
                <div>
                  <p className="font-semibold text-forest-primary dark:text-spore-ivory">{item.product.name}</p>
                  <p className="text-xs text-forest-primary/60 dark:text-spore-ivory/60">
                    {Number(item.quantity)}{" "}
                    {UNIT_LABELS[item.product.unitType]?.short ?? "unit"} ×{" "}
                    {formatCurrency(Number(item.unitPrice))}
                  </p>
                </div>
                <span className="font-data font-bold text-forest-primary dark:text-spore-ivory">
                  {formatCurrency(Number(item.totalPrice))}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/account/orders"
            className="rounded-full bg-forest-primary px-8 py-3 font-display text-sm font-semibold text-spore-ivory hover:bg-forest-hover"
          >
            Track in My Account
          </Link>
          <Link
            href="/products"
            className="rounded-full border border-forest-primary/20 dark:border-white/15 px-8 py-3 font-display text-sm font-semibold text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/5"
          >
            Continue Browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
