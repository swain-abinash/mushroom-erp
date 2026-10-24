import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { FinanceService } from "@/services/finance.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CreateSupplierModal, CreatePurchaseModal } from "./purchases-forms";

export const instant = false;
export const metadata: Metadata = { title: "Purchases & Suppliers — SporeERP Admin" };

export default async function AdminPurchasesPage() {
  await requirePermission(PERMISSIONS.PURCHASES_CREATE, "/admin/purchases");

  const [purchases, suppliers] = await Promise.all([
    FinanceService.listPurchases(25),
    FinanceService.listSuppliers(),
  ]);

  const totalSpent = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);

  return (
    <div className="flex flex-col gap-8 font-body text-stone-900 dark:text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Purchases &amp; Raw Material Suppliers</h1>
          <p className="mt-1 text-sm text-stone-700 dark:text-spore-ivory/70">
            Track paddy straw, spawn, substrate additives, and packaging supply procurement.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateSupplierModal />
          <CreatePurchaseModal
            suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>
      </header>

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-stone-600 dark:text-spore-ivory/60">Total Material Spent</p>
          <p className="font-data text-2xl font-bold text-stone-900 dark:text-spore-ivory">
            {formatCurrency(totalSpent)}
          </p>
          <p className="text-[11px] text-stone-600 dark:text-spore-ivory/50">Cumulative COGS expenditure</p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-stone-600 dark:text-spore-ivory/60">Active Suppliers</p>
          <p className="font-data text-2xl font-bold text-green-700 dark:text-success-mint">{suppliers.length}</p>
          <p className="text-[11px] text-stone-600 dark:text-spore-ivory/50">Spawn labs &amp; straw vendors</p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-stone-600 dark:text-spore-ivory/60">Purchase Orders</p>
          <p className="font-data text-2xl font-bold text-forest-primary/90 dark:text-spore-ivory/90">
            {purchases.length} POs
          </p>
          <p className="text-[11px] text-stone-600 dark:text-spore-ivory/50">Received into inventory</p>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <section className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-stone-200 dark:border-spore-ivory/10 pb-3">
          <h2 className="font-display text-lg font-bold">Purchase Orders Ledger</h2>
          <span className="text-xs text-stone-600 dark:text-spore-ivory/50">Auto-inwarded to Raw Inventory</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 dark:border-spore-ivory/10 text-xs uppercase tracking-wide text-stone-600 dark:text-spore-ivory/60">
              <tr>
                <th className="py-2.5">PO Number</th>
                <th className="py-2.5">Supplier</th>
                <th className="py-2.5">Materials Received</th>
                <th className="py-2.5">Quantity</th>
                <th className="py-2.5">Total Amount</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-spore-ivory/10 text-xs">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-600 dark:text-spore-ivory/50">
                    No purchase orders recorded yet. Click &quot;+ Record Raw Material Purchase&quot; above.
                  </td>
                </tr>
              ) : (
                purchases.map((po) => (
                  <tr key={po.id} className="hover:bg-stone-100 dark:hover:bg-spore-ivory/5">
                    <td className="py-3 font-data font-bold text-stone-900 dark:text-spore-ivory">
                      {po.purchaseNumber}
                    </td>
                    <td className="py-3 font-semibold text-stone-900 dark:text-spore-ivory">
                      {po.supplier.name}
                    </td>
                    <td className="py-3 text-stone-700 dark:text-spore-ivory/80">
                      {po.items.map((i) => i.materialName).join(", ")}
                    </td>
                    <td className="py-3 font-data">
                      {po.items.map((i) => `${Number(i.quantity)} ${i.unit}`).join(", ")}
                    </td>
                    <td className="py-3 font-data font-bold text-stone-900 dark:text-spore-ivory text-sm">
                      {formatCurrency(Number(po.totalAmount))}
                    </td>
                    <td className="py-3 font-data text-stone-600 dark:text-spore-ivory/60">
                      {formatDate(po.purchaseDate)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-success-mint/15 px-2.5 py-0.5 text-[10px] font-bold text-green-700 dark:text-success-mint">
                        {po.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Suppliers Directory */}
      <section className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Approved Suppliers Directory</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200 dark:border-spore-ivory/10 text-stone-600 dark:text-spore-ivory/60 uppercase">
              <tr>
                <th className="py-2">Supplier Name</th>
                <th className="py-2">Contact Person</th>
                <th className="py-2">Phone</th>
                <th className="py-2">Email</th>
                <th className="py-2">Materials Supplied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-spore-ivory/10">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-stone-100 dark:hover:bg-spore-ivory/5">
                  <td className="py-2.5 font-bold text-stone-900 dark:text-spore-ivory text-sm">{s.name}</td>
                  <td className="py-2.5 text-stone-700 dark:text-spore-ivory/80">{s.contactPerson ?? "—"}</td>
                  <td className="py-2.5 font-data text-stone-900 dark:text-spore-ivory">📞 {s.phone}</td>
                  <td className="py-2.5 text-stone-600 dark:text-spore-ivory/60">{s.email ?? "—"}</td>
                  <td className="py-2.5 text-stone-700 dark:text-spore-ivory/70">{s.materialsSupplied}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
