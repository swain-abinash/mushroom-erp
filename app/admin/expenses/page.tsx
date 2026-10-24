import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { FinanceService } from "@/services/finance.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseCategory } from "@prisma/client";
import { RecordExpenseModal } from "./expense-form";

export const instant = false;
export const metadata: Metadata = { title: "Expense Ledger — SporeERP Admin" };

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  RAW_MATERIAL: "Raw Materials",
  ELECTRICITY: "Electricity & AC",
  WATER: "Water & Humidity",
  FARM_LABOR: "Labor & Wages",
  PACKAGING: "Packaging & Boxes",
  RENT: "Rent",
  DELIVERY_FUEL: "Delivery Fuel",
  MARKETING: "Marketing",
  EQUIPMENT: "Equipment & Tools",
  MAINTENANCE: "Repairs & Maintenance",
  MISC: "Miscellaneous",
};

export default async function AdminExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  await requirePermission(PERMISSIONS.EXPENSES_RECORD, "/admin/expenses");

  const { category } = await searchParams;
  const categoryFilter =
    category && Object.values(ExpenseCategory).includes(category as ExpenseCategory)
      ? (category as ExpenseCategory)
      : undefined;

  const expenses = await FinanceService.listExpenses(categoryFilter, 50);
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  const categories = [
    { value: "", label: "All Expenses" },
    ...Object.values(ExpenseCategory).map((cat) => ({
      value: cat,
      label: CATEGORY_LABELS[cat] ?? cat,
    })),
  ];

  return (
    <div className="flex flex-col gap-8 font-body text-stone-900 dark:text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Operational Expense Ledger</h1>
          <p className="mt-1 text-sm text-stone-700 dark:text-spore-ivory/70">
            Log farm utilities, labor wages, delivery fuel, and substrate costs for real-time P&amp;L accounting.
          </p>
        </div>
        <RecordExpenseModal />
      </header>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-stone-600 dark:text-spore-ivory/60">
            Total Logged Expenses
          </p>
          <p className="font-data text-2xl font-bold text-red-600 dark:text-alert-coral">
            {formatCurrency(totalExpense)}
          </p>
          <p className="text-[11px] text-stone-600 dark:text-spore-ivory/50">Operating overhead</p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-stone-600 dark:text-spore-ivory/60">Ledger Entries</p>
          <p className="font-data text-2xl font-bold text-stone-900 dark:text-spore-ivory">
            {expenses.length} Records
          </p>
          <p className="text-[11px] text-stone-600 dark:text-spore-ivory/50">Recorded across active categories</p>
        </div>
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-1">
          <p className="text-xs uppercase font-semibold text-stone-600 dark:text-spore-ivory/60">Financial Impact</p>
          <Link
            href="/admin/reports/pnl"
            className="font-display text-sm font-bold text-green-700 dark:text-success-mint hover:underline block pt-1"
          >
            View Real-Time P&amp;L Statement →
          </Link>
          <p className="text-[11px] text-stone-600 dark:text-spore-ivory/50">Net profit and cost-per-kg</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stone-200 dark:border-spore-ivory/10 pb-3">
        {categories.map((c) => {
          const active = (categoryFilter ?? "") === c.value;
          return (
            <Link
              key={c.value}
              href={c.value ? `/admin/expenses?category=${c.value}` : "/admin/expenses"}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                active
                  ? "bg-forest-primary text-spore-ivory"
                  : "bg-surface-charcoal border border-stone-200 dark:border-spore-ivory/10 text-spore-ivory/70 hover:text-spore-ivory"
              }`}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* Expenses Table */}
      <section className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal/80 text-xs uppercase tracking-wide text-stone-600 dark:text-spore-ivory/60">
            <tr>
              <th className="px-4 py-3">Expense Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Description / Memo</th>
              <th className="px-4 py-3">Payment Method</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-spore-ivory/10 text-xs">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-stone-600 dark:text-spore-ivory/60">
                  No expenses recorded in this category. Click &quot;+ Record Farm Expense&quot; above.
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-stone-100 dark:hover:bg-spore-ivory/5 transition-colors">
                  <td className="px-4 py-3 font-data text-stone-700 dark:text-spore-ivory/70">
                    {formatDate(expense.expenseDate)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-forest-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-stone-900 dark:text-spore-ivory">
                      {CATEGORY_LABELS[expense.category] ?? expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-900 dark:text-spore-ivory">
                    {expense.description}
                  </td>
                  <td className="px-4 py-3 text-stone-700 dark:text-spore-ivory/70">
                    {expense.paymentMethod}
                  </td>
                  <td className="px-4 py-3 font-data font-bold text-red-600 dark:text-alert-coral text-sm">
                    {formatCurrency(Number(expense.amount))}
                  </td>
                  <td className="px-4 py-3 text-stone-600 dark:text-spore-ivory/60">
                    {expense.recorder.name}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
