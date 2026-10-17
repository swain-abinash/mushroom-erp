import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { InventoryService } from "@/services/inventory.service";
import { formatDate } from "@/lib/utils";
import { ItemCategory, InventoryTxType } from "@prisma/client";
import { InventoryItemRow, CreateItemForm } from "./inventory-forms";

export const metadata: Metadata = { title: "Inventory & Stock — SporeERP Admin" };

const TX_BADGES: Record<InventoryTxType, { label: string; style: string }> = {
  PURCHASE: { label: "Purchase (+)", style: "bg-success-mint/15 text-success-mint" },
  PRODUCTION_USE: { label: "Production (-)", style: "bg-shiitake-ochre/15 text-shiitake-ochre" },
  HARVEST_INJECTION: { label: "Harvest (+)", style: "bg-success-mint/20 text-success-mint" },
  CUSTOMER_SALE: { label: "Order Sale (-)", style: "bg-forest-primary/20 text-spore-ivory" },
  WASTAGE_SPOILAGE: { label: "Spoilage (-)", style: "bg-alert-coral/15 text-alert-coral" },
  RETURN: { label: "Return (+)", style: "bg-warning-amber/15 text-warning-amber" },
  MANUAL_ADJUSTMENT: { label: "Adjustment", style: "bg-spore-ivory/15 text-spore-ivory" },
};

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requirePermission(PERMISSIONS.INVENTORY_VIEW_STOCK, "/admin/inventory");

  const { category } = await searchParams;
  const categoryFilter =
    category && Object.values(ItemCategory).includes(category as ItemCategory)
      ? (category as ItemCategory)
      : undefined;

  const [items, transactions] = await Promise.all([
    InventoryService.listInventory(categoryFilter),
    InventoryService.listTransactions(15),
  ]);

  const totalFinishedStock = items
    .filter((i) => i.itemCategory === "FINISHED_PRODUCT")
    .reduce((sum, i) => sum + i.availableStockNum, 0);

  const totalReservedStock = items
    .filter((i) => i.itemCategory === "FINISHED_PRODUCT")
    .reduce((sum, i) => sum + i.reservedStockNum, 0);

  const lowStockCount = items.filter((i) => i.isLowStock).length;

  const categories = [
    { value: "", label: "All Stock" },
    { value: ItemCategory.FINISHED_PRODUCT, label: "Fresh & Dry Mushrooms" },
    { value: ItemCategory.RAW_MATERIAL, label: "Raw Materials & Spawn" },
    { value: ItemCategory.PACKAGING, label: "Packaging" },
    { value: ItemCategory.EQUIPMENT, label: "Equipment" },
  ];

  return (
    <div className="flex flex-col gap-8 font-body text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Inventory Ledger & Stock Control</h1>
          <p className="mt-1 text-sm text-spore-ivory/70">
            Real-time double-entry inventory tracking, stock adjustments, and harvest injections.
          </p>
        </div>
        <CreateItemForm />
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">
            Total Finished Mushrooms In Stock
          </p>
          <p className="font-data text-2xl font-bold text-success-mint">
            {totalFinishedStock.toFixed(1)} KG
          </p>
          <p className="text-[11px] text-spore-ivory/50">Sellable across store and B2B</p>
        </div>

        <div className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">
            Reserved for Confirmed Orders
          </p>
          <p className="font-data text-2xl font-bold text-warning-amber">
            {totalReservedStock.toFixed(1)} KG
          </p>
          <p className="text-[11px] text-spore-ivory/50">Locked to prevent overselling</p>
        </div>

        <div className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">Low Stock Warnings</p>
          <p className="font-data text-2xl font-bold text-alert-coral">
            {lowStockCount} {lowStockCount === 1 ? "Item" : "Items"}
          </p>
          <p className="text-[11px] text-spore-ivory/50">At or below reorder threshold</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-spore-ivory/10 pb-3">
        {categories.map((c) => {
          const active = (categoryFilter ?? "") === c.value;
          return (
            <Link
              key={c.value}
              href={c.value ? `/admin/inventory?category=${c.value}` : "/admin/inventory"}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-forest-primary text-spore-ivory"
                  : "bg-surface-charcoal border border-spore-ivory/10 text-spore-ivory/70 hover:text-spore-ivory"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* Inventory Items Table */}
      <section className="overflow-x-auto rounded-2xl border border-spore-ivory/10 bg-surface-charcoal">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-spore-ivory/10 bg-surface-charcoal/80 text-xs uppercase tracking-wide text-spore-ivory/60">
            <tr>
              <th className="px-4 py-3">Item Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Total Physical</th>
              <th className="px-4 py-3">Reserved</th>
              <th className="px-4 py-3">Sellable / Available</th>
              <th className="px-4 py-3">Reorder Alert</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spore-ivory/10">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-spore-ivory/60">
                  No inventory items found. Create a product or add raw material supplies above.
                </td>
              </tr>
            ) : (
              items.map((item) => <InventoryItemRow key={item.id} item={item} />)
            )}
          </tbody>
        </table>
      </section>

      {/* Real-Time Stock Transaction Log */}
      <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-3">
          <div>
            <h2 className="font-display text-lg font-bold">Recent Stock Transaction Log</h2>
            <p className="text-xs text-spore-ivory/60">
              Audit trail of every gram moved across sales, harvests, spoilage, and adjustments.
            </p>
          </div>
          <span className="text-xs text-spore-ivory/40">Showing last 15 movements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-spore-ivory/10 text-spore-ivory/60 uppercase">
              <tr>
                <th className="py-2.5">Date & Time</th>
                <th className="py-2.5">Item</th>
                <th className="py-2.5">Movement Type</th>
                <th className="py-2.5">Quantity</th>
                <th className="py-2.5">Balance After</th>
                <th className="py-2.5">Audit Reason</th>
                <th className="py-2.5">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spore-ivory/10">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-spore-ivory/50">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => {
                  const badge = TX_BADGES[tx.transactionType] ?? {
                    label: tx.transactionType,
                    style: "bg-spore-ivory/10 text-spore-ivory",
                  };
                  const qty = Number(tx.quantity);
                  return (
                    <tr key={tx.id} className="hover:bg-spore-ivory/5">
                      <td className="py-2.5 text-spore-ivory/50 font-data">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-2.5 font-semibold text-spore-ivory">
                        {tx.inventoryItem.itemName}
                      </td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${badge.style}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 font-data font-bold ${
                          qty > 0 ? "text-success-mint" : "text-alert-coral"
                        }`}
                      >
                        {qty > 0 ? `+${qty}` : qty} {tx.inventoryItem.unit}
                      </td>
                      <td className="py-2.5 font-data font-semibold text-spore-ivory">
                        {Number(tx.balanceAfter)} {tx.inventoryItem.unit}
                      </td>
                      <td className="py-2.5 text-spore-ivory/80 max-w-xs truncate">
                        {tx.reason ?? "—"}
                      </td>
                      <td className="py-2.5 text-spore-ivory/60">
                        {tx.actor?.name ?? "System"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
