import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { OrderService } from "@/services/order.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatus } from "@prisma/client";

export const instant = false;
export const metadata: Metadata = { title: "Orders — SporeERP Admin" };

const STATUS_PILLS: Record<OrderStatus, { label: string; style: string }> = {
  PENDING: { label: "Pending", style: "bg-warning-amber/15 text-warning-amber" },
  CONFIRMED: { label: "Confirmed", style: "bg-success-mint/15 text-success-mint" },
  PROCESSING: { label: "Harvesting / Picking", style: "bg-shiitake-ochre/15 text-shiitake-ochre" },
  PACKED: { label: "Packed in Chiller", style: "bg-forest-primary/20 text-spore-ivory" },
  OUT_FOR_DELIVERY: { label: "Out on Truck", style: "bg-forest-primary/30 text-success-mint" },
  DELIVERED: { label: "Delivered", style: "bg-success-mint/20 text-success-mint" },
  CANCELLED: { label: "Cancelled", style: "bg-alert-coral/15 text-alert-coral" },
  REFUNDED: { label: "Refunded", style: "bg-alert-coral/20 text-alert-coral" },
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  await requirePermission(PERMISSIONS.ORDERS_VIEW_ALL, "/admin/orders");

  const params = await searchParams;
  const statusFilter =
    params.status && Object.values(OrderStatus).includes(params.status as OrderStatus)
      ? (params.status as OrderStatus)
      : undefined;

  const { orders, pagination } = await OrderService.listAdminOrders({
    status: statusFilter,
    search: params.q,
    page: params.page ? parseInt(params.page, 10) : 1,
    limit: 20,
  });

  const statuses: Array<{ value: string; label: string }> = [
    { value: "", label: "All Orders" },
    { value: OrderStatus.CONFIRMED, label: "Confirmed" },
    { value: OrderStatus.PROCESSING, label: "Processing" },
    { value: OrderStatus.PACKED, label: "Packed" },
    { value: OrderStatus.OUT_FOR_DELIVERY, label: "Out for Delivery" },
    { value: OrderStatus.DELIVERED, label: "Delivered" },
    { value: OrderStatus.CANCELLED, label: "Cancelled" },
  ];

  return (
    <div className="flex flex-col gap-8 font-body text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Customer Orders & Fulfillment</h1>
          <p className="mt-1 text-sm text-spore-ivory/70">
            Real-time harvest fulfillment queue, dispatch slots, and delivery status tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-charcoal border border-spore-ivory/10 px-3 py-1 text-xs font-semibold">
            Total Orders: {pagination.total}
          </span>
        </div>
      </header>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-4">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => {
            const active = (statusFilter ?? "") === s.value;
            return (
              <Link
                key={s.value}
                href={s.value ? `/admin/orders?status=${s.value}` : "/admin/orders"}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-forest-primary text-spore-ivory"
                    : "bg-surface-charcoal border border-spore-ivory/10 text-spore-ivory/70 hover:text-spore-ivory"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>

        <form method="GET" className="flex items-center gap-2">
          {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search order #, customer, phone..."
            className="rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-1.5 text-xs text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          />
          <button
            type="submit"
            className="rounded-lg bg-forest-primary px-3 py-1.5 text-xs font-semibold text-spore-ivory hover:bg-forest-hover"
          >
            Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto rounded-2xl border border-spore-ivory/10 bg-surface-charcoal">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-spore-ivory/10 bg-surface-charcoal/80 text-xs uppercase tracking-wide text-spore-ivory/60">
            <tr>
              <th className="px-4 py-3">Order Number</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items / Variety</th>
              <th className="px-4 py-3">Slot</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spore-ivory/10">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-spore-ivory/60">
                  No orders found matching the filter criteria.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const pill = STATUS_PILLS[order.orderStatus] ?? {
                  label: order.orderStatus,
                  style: "bg-spore-ivory/10 text-spore-ivory",
                };
                return (
                  <tr key={order.id} className="hover:bg-spore-ivory/5 transition-colors">
                    <td className="px-4 py-3 font-data font-bold">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="hover:underline text-forest-primary/90 hover:text-spore-ivory"
                      >
                        {order.orderNumber}
                      </Link>
                      <div className="text-[11px] font-normal text-spore-ivory/50">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-spore-ivory">
                        {order.customer.user.name}
                      </div>
                      <div className="text-xs text-spore-ivory/60">
                        {order.customer.user.phone ?? order.customer.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        {order.items.map((i) => i.product.name).join(", ")}
                      </div>
                      <div className="text-[11px] text-spore-ivory/50">
                        {order.items.length} {order.items.length === 1 ? "line item" : "line items"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {order.deliverySlot === "MORNING_HARVEST_DISPATCH" ? (
                        <span className="text-warning-amber">🌅 Morning</span>
                      ) : (
                        <span className="text-shiitake-ochre">🌆 Evening</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-data font-bold">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`font-semibold ${
                          order.paymentStatus === "PAID"
                            ? "text-success-mint"
                            : "text-warning-amber"
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pill.style}`}
                      >
                        {pill.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-lg bg-surface-charcoal border border-spore-ivory/20 px-3 py-1 text-xs font-semibold hover:bg-forest-primary hover:border-forest-primary transition-colors"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
