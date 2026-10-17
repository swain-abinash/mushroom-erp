import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { OrderService } from "@/services/order.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { UNIT_LABELS } from "@/lib/catalog/format";
import { OrderStatus } from "@prisma/client";
import { updateOrderStatusAction } from "../actions";

export const metadata: Metadata = { title: "Manage Order — SporeERP Admin" };

const NEXT_STATUS_MAP: Record<OrderStatus, OrderStatus | null> = {
  PENDING: OrderStatus.CONFIRMED,
  CONFIRMED: OrderStatus.PROCESSING,
  PROCESSING: OrderStatus.PACKED,
  PACKED: OrderStatus.OUT_FOR_DELIVERY,
  OUT_FOR_DELIVERY: OrderStatus.DELIVERED,
  DELIVERED: null,
  CANCELLED: null,
  REFUNDED: null,
};

const NEXT_ACTION_LABELS: Record<OrderStatus, string> = {
  PENDING: "Confirm Order",
  CONFIRMED: "Start Harvesting & Packing",
  PROCESSING: "Mark as Packed in Chiller",
  PACKED: "Dispatch on Van",
  OUT_FOR_DELIVERY: "Mark Delivered (Fulfill Stock)",
  DELIVERED: "",
  CANCELLED: "",
  REFUNDED: "",
};

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requirePermission(PERMISSIONS.ORDERS_VIEW_ALL, "/admin/orders");
  const canUpdate = hasPermission(user, PERMISSIONS.ORDERS_UPDATE_STATUS);

  let order;
  try {
    order = await OrderService.getOrder(id);
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
    addressType?: string;
  };

  const nextStatus = NEXT_STATUS_MAP[order.orderStatus];
  const nextActionLabel = NEXT_ACTION_LABELS[order.orderStatus];

  return (
    <div className="flex flex-col gap-8 font-body text-spore-ivory">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-spore-ivory/60 mb-2">
            <Link href="/admin/orders" className="hover:underline">
              Orders
            </Link>{" "}
            / {order.orderNumber}
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold">{order.orderNumber}</h1>
            <span className="rounded-full bg-forest-primary/20 border border-forest-primary/40 px-3 py-0.5 text-xs font-bold text-spore-ivory">
              {order.orderStatus.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 text-xs text-spore-ivory/60">
            Placed on {formatDate(order.createdAt)} • Dispatch Slot:{" "}
            <strong>{order.deliverySlot}</strong>
          </p>
        </div>

        {/* Status Transition Action Buttons */}
        {canUpdate && order.orderStatus !== "DELIVERED" && order.orderStatus !== "CANCELLED" && (
          <div className="flex items-center gap-3">
            {nextStatus && (
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await updateOrderStatusAction(formData);
                }}
              >
                <input type="hidden" name="orderId" value={order.id} />
                <input type="hidden" name="status" value={nextStatus} />
                <button
                  type="submit"
                  className="rounded-full bg-success-mint px-5 py-2 text-xs font-bold text-surface-charcoal hover:bg-success-mint/90 transition-colors shadow-xs"
                >
                  ⚡ {nextActionLabel} →
                </button>
              </form>
            )}

            <form
              action={async (formData: FormData) => {
                "use server";
                await updateOrderStatusAction(formData);
              }}
            >
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="status" value={OrderStatus.CANCELLED} />
              <input
                type="hidden"
                name="notes"
                value="Cancelled by admin / customer request. Reserved stock released."
              />
              <button
                type="submit"
                className="rounded-full border border-alert-coral/40 px-4 py-2 text-xs font-semibold text-alert-coral hover:bg-alert-coral/10 transition-colors"
              >
                Cancel Order
              </button>
            </form>
          </div>
        )}
      </header>

      {/* 2 Column Details Layout */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Items & Timeline (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Order Items Table */}
          <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">Ordered Mushrooms</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-spore-ivory/10 text-xs uppercase text-spore-ivory/60">
                  <tr>
                    <th className="py-2">Item</th>
                    <th className="py-2">Unit</th>
                    <th className="py-2">Quantity</th>
                    <th className="py-2">Unit Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-spore-ivory/10">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-semibold text-spore-ivory">
                        {item.product.name}
                      </td>
                      <td className="py-3 text-xs text-spore-ivory/60">
                        {UNIT_LABELS[item.product.unitType]?.short ?? "unit"}
                      </td>
                      <td className="py-3 font-data font-bold">
                        {Number(item.quantity)}
                      </td>
                      <td className="py-3 font-data">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="py-3 font-data font-bold text-right">
                        {formatCurrency(Number(item.totalPrice))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-spore-ivory/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-spore-ivory/70">
                <span>Subtotal</span>
                <span className="font-data font-semibold">
                  {formatCurrency(Number(order.subtotal))}
                </span>
              </div>
              <div className="flex justify-between text-spore-ivory/70">
                <span>Delivery Fee</span>
                <span className="font-data font-semibold">
                  {Number(order.deliveryFee) === 0 ? "FREE" : formatCurrency(Number(order.deliveryFee))}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-spore-ivory pt-2 border-t border-spore-ivory/10">
                <span>Total Amount</span>
                <span className="font-data text-lg text-success-mint">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
            </div>
          </section>

          {/* Status History & Audit Timeline */}
          <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 space-y-4">
            <h2 className="font-display text-lg font-bold">Fulfillment History & Timeline</h2>
            <div className="space-y-4">
              {order.statusHistory.map((hist) => (
                <div key={hist.id} className="flex gap-4 items-start text-xs">
                  <div className="flex size-7 items-center justify-center rounded-full bg-forest-primary/20 text-spore-ivory shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1 border-b border-spore-ivory/5 pb-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-spore-ivory text-sm">
                        {hist.status.replace(/_/g, " ")}
                      </span>
                      <span className="text-spore-ivory/50">{formatDate(hist.changedAt)}</span>
                    </div>
                    {hist.notes && (
                      <p className="text-spore-ivory/70 mt-0.5">{hist.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Customer & Address & Payment (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Card */}
          <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-3 text-sm">
            <h3 className="font-display font-bold text-base text-spore-ivory">Customer Details</h3>
            <div>
              <p className="font-semibold text-spore-ivory">{order.customer.user.name}</p>
              <p className="text-xs text-spore-ivory/60">{order.customer.user.email}</p>
              <p className="text-xs text-spore-ivory/60">
                📞 {order.customer.user.phone ?? "No phone"}
              </p>
            </div>
            <div className="pt-2 border-t border-spore-ivory/10 text-xs text-spore-ivory/70">
              <span>Account Type: </span>
              <strong className="text-spore-ivory">{order.customer.customerType}</strong>
              {order.customer.companyName && (
                <p className="mt-0.5 font-semibold text-spore-ivory">
                  Company: {order.customer.companyName}
                </p>
              )}
            </div>
          </section>

          {/* Delivery Address Card */}
          <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-3 text-sm">
            <h3 className="font-display font-bold text-base text-spore-ivory">Delivery Address</h3>
            <div className="text-xs text-spore-ivory/80 space-y-1">
              <p className="font-bold text-sm text-spore-ivory">{address.recipientName}</p>
              <p>
                {address.addressLine1}
                {address.addressLine2 ? `, ${address.addressLine2}` : ""}
              </p>
              <p>
                {address.city}, {address.state} — {address.pincode}
              </p>
              <p className="text-spore-ivory/60 mt-1">📞 {address.recipientPhone}</p>
            </div>
            <div className="pt-2 border-t border-spore-ivory/10 text-xs text-spore-ivory/70">
              <span>Slot: </span>
              <span className="font-semibold text-spore-ivory">{order.deliverySlot}</span>
            </div>
            {order.notes && (
              <div className="rounded-lg bg-surface-charcoal/50 border border-spore-ivory/10 p-2 text-[11px] text-spore-ivory/70">
                <strong>Customer Note: </strong>
                {order.notes}
              </div>
            )}
          </section>

          {/* Payment Card */}
          <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-3 text-sm">
            <h3 className="font-display font-bold text-base text-spore-ivory">Payment Record</h3>
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-spore-ivory/60">Method:</span>
                <span className="font-semibold text-spore-ivory">
                  {order.payments[0]?.method?.replace(/_/g, " ") ?? "Cash on Delivery"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-spore-ivory/60">Status:</span>
                <span
                  className={`font-bold ${
                    order.paymentStatus === "PAID"
                      ? "text-success-mint"
                      : "text-warning-amber"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.payments[0]?.transactionId && (
                <div className="flex justify-between">
                  <span className="text-spore-ivory/60">Txn ID:</span>
                  <span className="font-data text-[11px] text-spore-ivory">
                    {order.payments[0].transactionId}
                  </span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
