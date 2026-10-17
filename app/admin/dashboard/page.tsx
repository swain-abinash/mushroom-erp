import Link from "next/link";
import { requireStaff } from "@/lib/auth/dal";
import { ROLE_DEFINITIONS, type RoleName } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { FinanceService } from "@/services/finance.service";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [user, { error }] = await Promise.all([requireStaff(), searchParams]);
  const roleNames = user.roles.map(
    (role) => ROLE_DEFINITIONS[role as RoleName]?.displayName ?? role,
  );

  const [pnl, pendingOrdersCount, finishedStock, activeBatches, recentOrders] =
    await Promise.all([
      FinanceService.getProfitAndLoss("all"),
      db.order.count({
        where: { orderStatus: { in: ["CONFIRMED", "PROCESSING", "PACKED"] } },
      }),
      db.inventoryItem.aggregate({
        where: { itemCategory: "FINISHED_PRODUCT" },
        _sum: { availableStock: true, reservedStock: true },
      }),
      db.productionBatch.count({
        where: { status: { notIn: ["COMPLETED", "CONTAMINATED"] } },
      }),
      db.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          customer: { include: { user: { select: { name: true } } } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
    ]);

  const availableKg = Number(finishedStock._sum.availableStock ?? 0);
  const reservedKg = Number(finishedStock._sum.reservedStock ?? 0);

  return (
    <div className="flex flex-col gap-8 font-body text-spore-ivory">
      {error === "restricted" ? (
        <p
          role="alert"
          className="rounded-lg bg-alert-coral/10 border border-alert-coral/20 px-4 py-2.5 text-xs text-alert-coral"
        >
          That area is restricted to founder administrators.
        </p>
      ) : null}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Executive Command Center</h1>
          <p className="mt-1 text-sm text-spore-ivory/70">
            Signed in as <strong className="text-spore-ivory">{user.name}</strong> ·{" "}
            {roleNames.join(", ")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href="/admin/orders"
            className="rounded-full bg-forest-primary px-4 py-2 font-bold text-spore-ivory hover:bg-forest-hover transition-colors"
          >
            Fulfill Orders ({pendingOrdersCount})
          </Link>
          <Link
            href="/admin/production/harvests"
            className="rounded-full bg-success-mint px-4 py-2 font-bold text-surface-charcoal hover:bg-success-mint/90 transition-colors"
          >
            + Log Morning Harvest
          </Link>
          <Link
            href="/admin/expenses"
            className="rounded-full border border-spore-ivory/20 px-4 py-2 font-semibold text-spore-ivory hover:bg-spore-ivory/5 transition-colors"
          >
            + Record Expense
          </Link>
        </div>
      </header>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Link
          href="/admin/orders"
          className="group rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1 transition-all hover:border-forest-primary/50"
        >
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">
            Pending Dispatch Queue
          </p>
          <p className="font-data text-2xl font-bold text-warning-amber">
            {pendingOrdersCount} Orders
          </p>
          <p className="text-[11px] text-spore-ivory/50">Need harvesting &amp; packing</p>
        </Link>

        <Link
          href="/admin/inventory"
          className="group rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1 transition-all hover:border-forest-primary/50"
        >
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">
            Sellable Finished Stock
          </p>
          <p className="font-data text-2xl font-bold text-success-mint">
            {(availableKg - reservedKg).toFixed(1)} KG
          </p>
          <p className="text-[11px] text-spore-ivory/50">
            Total {availableKg.toFixed(1)} KG ({reservedKg.toFixed(1)} KG reserved)
          </p>
        </Link>

        <Link
          href="/admin/production/batches"
          className="group rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1 transition-all hover:border-forest-primary/50"
        >
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">Active Grow Batches</p>
          <p className="font-data text-2xl font-bold text-spore-ivory">
            {activeBatches} Batches
          </p>
          <p className="text-[11px] text-spore-ivory/50">In fruiting &amp; incubation rooms</p>
        </Link>

        <Link
          href="/admin/reports/pnl"
          className="group rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1 transition-all hover:border-forest-primary/50"
        >
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">Net Profit (All Time)</p>
          <p
            className={`font-data text-2xl font-bold ${
              pnl.netProfit >= 0 ? "text-success-mint" : "text-alert-coral"
            }`}
          >
            {formatCurrency(pnl.netProfit)}
          </p>
          <p className="text-[11px] text-spore-ivory/50">Revenue: {formatCurrency(pnl.salesRevenue)}</p>
        </Link>
      </div>

      {/* Recent Orders Queue */}
      <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold">Recent Customer Orders</h2>
            <p className="text-xs text-spore-ivory/60">Live harvest orders received from storefront</p>
          </div>
          <Link href="/admin/orders" className="text-xs text-forest-primary/90 hover:underline">
            View all orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-spore-ivory/10 text-spore-ivory/60 uppercase">
              <tr>
                <th className="py-2.5">Order Number</th>
                <th className="py-2.5">Customer</th>
                <th className="py-2.5">Items</th>
                <th className="py-2.5">Slot</th>
                <th className="py-2.5">Total Amount</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spore-ivory/10">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-spore-ivory/50">
                    No orders placed yet. Customers can order fresh mushrooms on the storefront.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-spore-ivory/5">
                    <td className="py-2.5 font-data font-bold text-spore-ivory">
                      <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                        {order.orderNumber}
                      </Link>
                      <div className="text-[10px] font-normal text-spore-ivory/50">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="py-2.5 font-semibold text-spore-ivory">
                      {order.customer.user.name}
                    </td>
                    <td className="py-2.5 text-spore-ivory/80">
                      {order.items.map((i) => i.product.name).join(", ")}
                    </td>
                    <td className="py-2.5 text-warning-amber">
                      {order.deliverySlot === "MORNING_HARVEST_DISPATCH" ? "🌅 Morning" : "🌆 Evening"}
                    </td>
                    <td className="py-2.5 font-data font-bold text-spore-ivory">
                      {formatCurrency(Number(order.totalAmount))}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-forest-primary/20 px-2 py-0.5 text-[10px] font-bold text-spore-ivory">
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-lg bg-surface-charcoal border border-spore-ivory/20 px-2.5 py-1 text-[11px] font-semibold hover:bg-forest-primary hover:border-forest-primary transition-colors"
                      >
                        Manage →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
