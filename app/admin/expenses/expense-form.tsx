"use client";

import { useState } from "react";
import { recordExpenseAction } from "./actions";
import { ExpenseCategory } from "@prisma/client";

export function RecordExpenseModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-forest-primary px-5 py-2 font-display text-xs font-bold text-spore-ivory hover:bg-forest-hover transition-colors"
      >
        + Record Farm Expense
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await recordExpenseAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to save expense.");
      return;
    }

    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-body">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal p-6 shadow-2xl text-stone-900 dark:text-spore-ivory space-y-4">
        <div className="flex justify-between items-center border-b border-stone-200 dark:border-spore-ivory/10 pb-3">
          <h3 className="font-display font-bold text-lg">Record Operational Expense</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-stone-600 dark:text-spore-ivory/60 hover:text-stone-900 dark:hover:text-spore-ivory"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-alert-coral/15 border border-alert-coral/30 p-2 text-xs text-red-600 dark:text-alert-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Expense Category *</label>
            <select
              name="category"
              required
              className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
            >
              <option value={ExpenseCategory.ELECTRICITY}>Electricity &amp; Air Conditioning</option>
              <option value={ExpenseCategory.FARM_LABOR}>Farm Labor &amp; Wages</option>
              <option value={ExpenseCategory.DELIVERY_FUEL}>Delivery Fuel &amp; Transport</option>
              <option value={ExpenseCategory.PACKAGING}>Packaging (Trays &amp; Clamshells)</option>
              <option value={ExpenseCategory.WATER}>Water &amp; Humidification</option>
              <option value={ExpenseCategory.RENT}>Farm Shed Rent</option>
              <option value={ExpenseCategory.MARKETING}>Marketing &amp; Customer Acquisition</option>
              <option value={ExpenseCategory.EQUIPMENT}>Tools &amp; Sprayers</option>
              <option value={ExpenseCategory.MAINTENANCE}>Repairs &amp; Maintenance</option>
              <option value={ExpenseCategory.RAW_MATERIAL}>Miscellaneous Materials</option>
              <option value={ExpenseCategory.MISC}>General Miscellaneous</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                name="amount"
                required
                placeholder="e.g. 1500"
                className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Expense Date *</label>
              <input
                type="date"
                name="expenseDate"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Description / Memo *</label>
            <input
              type="text"
              name="description"
              required
              placeholder="e.g. Electricity bill for fruiting chamber AC..."
              className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Payment Method</label>
            <select
              name="paymentMethod"
              className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
            >
              <option value="UPI">UPI / Google Pay</option>
              <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
              <option value="Cash">Cash / Petty Cash</option>
              <option value="Debit/Credit Card">Card</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-spore-ivory/10">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-stone-200 dark:border-spore-ivory/20 px-4 py-2 font-semibold hover:bg-stone-100 dark:hover:bg-spore-ivory/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-forest-primary px-5 py-2 font-bold text-spore-ivory hover:bg-forest-hover disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
