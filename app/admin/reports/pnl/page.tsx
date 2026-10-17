import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { FinanceService } from "@/services/finance.service";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Executive P&L Statement — SporeERP Admin" };

export default async function AdminPnlReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  await requirePermission(PERMISSIONS.FINANCE_PNL_VIEW, "/admin/reports/pnl");

  const { period } = await searchParams;
  const activePeriod = (["today", "week", "month", "all"].includes(period ?? "")
    ? period
    : "all") as "today" | "week" | "month" | "all";

  const pnl = await FinanceService.getProfitAndLoss(activePeriod);

  const periods = [
    { value: "all", label: "All Time" },
    { value: "month", label: "This Month" },
    { value: "week", label: "Last 7 Days" },
    { value: "today", label: "Today" },
  ];

  return (
    <div className="flex flex-col gap-8 font-body text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Executive Financial Command Center &amp; P&amp;L
          </h1>
          <p className="mt-1 text-sm text-spore-ivory/70">
            Automated real-time profit &amp; loss statement computed directly from customer orders, raw purchases, and farm expenses.
          </p>
        </div>

        {/* Time Period Filter Pills */}
        <div className="flex gap-1.5 rounded-full border border-spore-ivory/10 bg-surface-charcoal p-1 text-xs">
          {periods.map((p) => {
            const active = activePeriod === p.value;
            return (
              <Link
                key={p.value}
                href={`/admin/reports/pnl?period=${p.value}`}
                className={`rounded-full px-4 py-1.5 font-semibold transition-colors ${
                  active
                    ? "bg-forest-primary text-spore-ivory shadow-xs"
                    : "text-spore-ivory/60 hover:text-spore-ivory"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Top Level Financial KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">Sales Revenue</p>
          <p className="font-data text-2xl font-bold text-spore-ivory">
            {formatCurrency(pnl.salesRevenue)}
          </p>
          <p className="text-[11px] text-spore-ivory/50">
            {pnl.totalOrdersCount} orders • {pnl.totalMushroomsSoldKg.toFixed(1)} KG sold
          </p>
        </div>

        <div className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">Gross Profit</p>
          <p
            className={`font-data text-2xl font-bold ${
              pnl.grossProfit >= 0 ? "text-success-mint" : "text-alert-coral"
            }`}
          >
            {formatCurrency(pnl.grossProfit)}
          </p>
          <p className="text-[11px] text-spore-ivory/50">
            {pnl.grossMarginPercent.toFixed(1)}% Gross Margin
          </p>
        </div>

        <div className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">Operating Expenses</p>
          <p className="font-data text-2xl font-bold text-alert-coral">
            {formatCurrency(pnl.totalOperatingExpenses)}
          </p>
          <p className="text-[11px] text-spore-ivory/50">Utilities, labor, fuel &amp; rent</p>
        </div>

        <div className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-spore-ivory/60">Net Profit (EBITDA)</p>
          <p
            className={`font-data text-2xl font-bold ${
              pnl.netProfit >= 0 ? "text-success-mint" : "text-alert-coral"
            }`}
          >
            {formatCurrency(pnl.netProfit)}
          </p>
          <p className="text-[11px] text-spore-ivory/50">
            {pnl.netMarginPercent.toFixed(1)}% Net Margin
          </p>
        </div>
      </div>

      {/* Main P&L Statement */}
      <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-8 space-y-6">
        <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold">Standard Income &amp; Expense Statement</h2>
            <p className="text-xs text-spore-ivory/60">
              Period: {activePeriod.toUpperCase()} (Automated double-entry reconciliation)
            </p>
          </div>
          <span className="rounded-full bg-forest-primary/20 px-3 py-1 text-xs font-bold text-spore-ivory">
            Currency: INR (₹)
          </span>
        </div>

        <div className="space-y-4 text-sm font-body">
          {/* Revenue Section */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-base text-spore-ivory border-b border-spore-ivory/10 pb-1">
              <span>1. Total Operating Revenue</span>
              <span className="font-data">{formatCurrency(pnl.salesRevenue)}</span>
            </div>
            <div className="flex justify-between text-xs text-spore-ivory/70 pl-4">
              <span>Fresh Mushroom Sales &amp; Delivery Income</span>
              <span className="font-data">{formatCurrency(pnl.salesRevenue)}</span>
            </div>
          </div>

          {/* COGS Section */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between font-bold text-base text-alert-coral border-b border-spore-ivory/10 pb-1">
              <span>2. Less: Cost of Goods Sold (COGS)</span>
              <span className="font-data">- {formatCurrency(pnl.cogs)}</span>
            </div>
            <div className="flex justify-between text-xs text-spore-ivory/70 pl-4">
              <span>Raw Materials (Grain Spawn, Paddy Straw, Wheat Bran, Lime)</span>
              <span className="font-data">{formatCurrency(pnl.cogs)}</span>
            </div>
          </div>

          {/* Gross Profit Subtotal */}
          <div className="rounded-xl bg-spore-ivory/5 p-4 flex justify-between font-bold text-base text-spore-ivory">
            <div>
              <span>GROSS PROFIT</span>
              <span className="ml-3 text-xs font-normal text-spore-ivory/60">
                (Margin: {pnl.grossMarginPercent.toFixed(1)}%)
              </span>
            </div>
            <span
              className={`font-data text-lg ${
                pnl.grossProfit >= 0 ? "text-success-mint" : "text-alert-coral"
              }`}
            >
              {formatCurrency(pnl.grossProfit)}
            </span>
          </div>

          {/* Operating Expenses Section */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between font-bold text-base text-alert-coral border-b border-spore-ivory/10 pb-1">
              <span>3. Less: Operating Expenses (OPEX)</span>
              <span className="font-data">- {formatCurrency(pnl.totalOperatingExpenses)}</span>
            </div>

            {Object.entries(pnl.expensesByCategory).length === 0 ? (
              <p className="text-xs text-spore-ivory/40 pl-4">No operating expenses recorded yet.</p>
            ) : (
              Object.entries(pnl.expensesByCategory).map(([cat, amt]) => (
                <div key={cat} className="flex justify-between text-xs text-spore-ivory/70 pl-4">
                  <span>{cat.replace(/_/g, " ")}</span>
                  <span className="font-data">{formatCurrency(amt)}</span>
                </div>
              ))
            )}
          </div>

          {/* Net Profit Final */}
          <div className="rounded-2xl bg-forest-primary/20 border border-forest-primary/40 p-5 flex justify-between items-center font-bold text-lg text-spore-ivory">
            <div>
              <span className="font-display">NET EARNINGS / EBITDA</span>
              <span className="ml-3 text-xs font-normal text-spore-ivory/70">
                (Net Margin: {pnl.netMarginPercent.toFixed(1)}%)
              </span>
            </div>
            <span
              className={`font-data text-2xl ${
                pnl.netProfit >= 0 ? "text-success-mint" : "text-alert-coral"
              }`}
            >
              {formatCurrency(pnl.netProfit)}
            </span>
          </div>
        </div>
      </section>

      {/* Production Agronomy Unit Economics */}
      <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Agronomy &amp; Unit Economics</h2>
        <div className="grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-xl border border-spore-ivory/10 p-4 space-y-1">
            <p className="text-spore-ivory/60 uppercase font-semibold">Total Harvested Volume</p>
            <p className="font-data text-xl font-bold text-success-mint">
              {pnl.totalHarvestedKg.toFixed(1)} KG
            </p>
            <p className="text-[11px] text-spore-ivory/50">From active fruiting batches</p>
          </div>

          <div className="rounded-xl border border-spore-ivory/10 p-4 space-y-1">
            <p className="text-spore-ivory/60 uppercase font-semibold">Total Fulfillment Volume</p>
            <p className="font-data text-xl font-bold text-spore-ivory">
              {pnl.totalMushroomsSoldKg.toFixed(1)} KG
            </p>
            <p className="text-[11px] text-spore-ivory/50">Dispatched to customers &amp; B2B</p>
          </div>

          <div className="rounded-xl border border-spore-ivory/10 p-4 space-y-1">
            <p className="text-spore-ivory/60 uppercase font-semibold">All-In Production Cost / KG</p>
            <p className="font-data text-xl font-bold text-warning-amber">
              {pnl.costPerKgProduced > 0 ? formatCurrency(pnl.costPerKgProduced) : "₹0.00"} / KG
            </p>
            <p className="text-[11px] text-spore-ivory/50">(COGS + OPEX) / Harvest Yield</p>
          </div>
        </div>
      </section>
    </div>
  );
}
