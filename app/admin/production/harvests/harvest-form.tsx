"use client";

import { useState } from "react";
import { logHarvestAction } from "../actions";

export function RapidHarvestForm({
  batches,
}: {
  batches: Array<{ id: string; batchNumber: string; mushroomType: string }>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Rapid inputs
  const [totalWeight, setTotalWeight] = useState<string>("");
  const [gradeA, setGradeA] = useState<string>("");
  const [gradeB, setGradeB] = useState<string>("");
  const [gradeC, setGradeC] = useState<string>("");
  const [wastage, setWastage] = useState<string>("");

  const handleTotalChange = (val: string) => {
    setTotalWeight(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      // By default autofill 85% Grade A and 15% Grade B for speedy <30s entry!
      setGradeA((num * 0.85).toFixed(1));
      setGradeB((num * 0.15).toFixed(1));
      setGradeC("0.0");
      setWastage("0.0");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const res = await logHarvestAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to log harvest.");
      return;
    }

    setSuccess(true);
    setTotalWeight("");
    setGradeA("");
    setGradeB("");
    setGradeC("");
    setWastage("");
  };

  return (
    <div className="rounded-2xl border border-forest-primary/30 bg-surface-charcoal p-6 shadow-xl space-y-5 font-body text-spore-ivory">
      <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-3">
        <div>
          <h2 className="font-display font-bold text-lg text-success-mint">
            ⚡ Rapid Harvest Logger (&lt;30 Seconds)
          </h2>
          <p className="text-xs text-spore-ivory/60">
            Automatically increments finished stock and updates batch biological efficiency.
          </p>
        </div>
        <span className="rounded-full bg-success-mint/15 px-3 py-1 text-xs font-bold text-success-mint">
          Auto-Inventory Sync Active
        </span>
      </div>

      {error && (
        <div className="rounded-lg bg-alert-coral/15 border border-alert-coral/30 p-2.5 text-xs text-alert-coral">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-success-mint/15 border border-success-mint/30 p-3 text-xs text-success-mint font-semibold flex items-center gap-2">
          <span>✓</span>
          <span>Harvest logged successfully! Finished goods inventory has been updated.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block font-semibold mb-1">Production Batch *</label>
            <select
              name="batchId"
              required
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory text-xs focus:border-forest-primary focus:outline-hidden"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} — {b.mushroomType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Harvest Flush</label>
            <select
              name="flushNumber"
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory text-xs focus:border-forest-primary focus:outline-hidden"
            >
              <option value="1">Flush #1 (Peak First Break)</option>
              <option value="2">Flush #2 (Secondary Flush)</option>
              <option value="3">Flush #3 (Late Flush)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Harvest Date *</label>
            <input
              type="date"
              name="harvestDate"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory text-xs focus:border-forest-primary focus:outline-hidden"
            />
          </div>
        </div>

        {/* Primary Total Yield Input */}
        <div className="rounded-xl border border-success-mint/30 bg-success-mint/5 p-4 space-y-2">
          <label className="block font-display text-sm font-bold text-success-mint">
            Total Harvest Weight (KG) *
          </label>
          <input
            type="number"
            step="0.05"
            name="totalWeightKg"
            required
            placeholder="e.g. 15.5"
            value={totalWeight}
            onChange={(e) => handleTotalChange(e.target.value)}
            className="w-full rounded-xl border border-success-mint/40 bg-surface-charcoal px-4 py-3 font-data text-2xl font-bold text-spore-ivory focus:border-success-mint focus:outline-hidden"
          />
          <p className="text-[11px] text-spore-ivory/60">
            Tip: Entering total weight automatically calculates default quality splits below.
          </p>
        </div>

        {/* Quality Split Breakdown */}
        <div className="space-y-2">
          <p className="font-semibold text-spore-ivory/80">Quality Grading Split (KG):</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-success-mint mb-1">
                Grade A (Whole/Premium)
              </label>
              <input
                type="number"
                step="0.05"
                name="gradeAKg"
                value={gradeA}
                onChange={(e) => setGradeA(e.target.value)}
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-warning-amber mb-1">
                Grade B (Button/Small)
              </label>
              <input
                type="number"
                step="0.05"
                name="gradeBKg"
                value={gradeB}
                onChange={(e) => setGradeB(e.target.value)}
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-shiitake-ochre mb-1">
                Grade C (Dry / Powder)
              </label>
              <input
                type="number"
                step="0.05"
                name="gradeCDryKg"
                value={gradeC}
                onChange={(e) => setGradeC(e.target.value)}
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-alert-coral mb-1">
                Wastage / Spoiled
              </label>
              <input
                type="number"
                step="0.05"
                name="wastageKg"
                value={wastage}
                onChange={(e) => setWastage(e.target.value)}
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Notes / Flush Remarks (Optional)</label>
          <input
            type="text"
            name="notes"
            placeholder="e.g. Clean flush, tight clusters, zero cap spotting..."
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !totalWeight}
          className="w-full rounded-full bg-success-mint py-3.5 font-display text-sm font-bold text-surface-charcoal hover:bg-success-mint/90 transition-all shadow-md disabled:opacity-40 cursor-pointer"
        >
          {isSubmitting ? "Syncing harvest & inventory..." : "Confirm Harvest & Inject Into Stock →"}
        </button>
      </form>
    </div>
  );
}
