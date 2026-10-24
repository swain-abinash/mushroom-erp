"use client";

import { useState } from "react";
import { adjustStockAction, createInventoryItemAction } from "./actions";
import { InventoryTxType, ItemCategory } from "@prisma/client";

export function StockAdjustmentModal({
  item,
  onClose,
}: {
  item: { id: string; itemName: string; unit: string; availableStockNum: number };
  onClose: () => void;
}) {
  const [txType, setTxType] = useState<InventoryTxType>(InventoryTxType.MANUAL_ADJUSTMENT);
  const [quantity, setQuantity] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append("inventoryItemId", item.id);
    formData.append("transactionType", txType);
    formData.append("quantity", quantity);
    formData.append("reason", reason);

    const res = await adjustStockAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to adjust stock.");
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-body">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal p-6 shadow-2xl text-stone-900 dark:text-spore-ivory space-y-4">
        <div className="flex justify-between items-center border-b border-stone-200 dark:border-spore-ivory/10 pb-3">
          <div>
            <h3 className="font-display font-bold text-lg">Stock Adjustment</h3>
            <p className="text-xs text-stone-600 dark:text-spore-ivory/60">
              {item.itemName} (Current Stock: {item.availableStockNum} {item.unit})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-600 dark:text-spore-ivory/60 hover:text-stone-900 dark:hover:text-spore-ivory"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-alert-coral/15 border border-alert-coral/30 p-2.5 text-xs text-red-600 dark:text-alert-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Adjustment Type</label>
            <select
              value={txType}
              onChange={(e) => setTxType(e.target.value as InventoryTxType)}
              className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
            >
              <option value={InventoryTxType.MANUAL_ADJUSTMENT}>
                Manual Stock Count Adjustment (+ / -)
              </option>
              <option value={InventoryTxType.WASTAGE_SPOILAGE}>
                Wastage / Fresh Spoilage (Write-off -)
              </option>
              <option value={InventoryTxType.PURCHASE}>Purchase Inward (+)</option>
              <option value={InventoryTxType.RETURN}>Customer Return (+)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">
              Quantity to Adjust ({item.unit}) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. -2.5 for spoilage, 10 for count increase"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
            />
            <p className="text-[11px] text-stone-600 dark:text-spore-ivory/50 mt-1">
              Enter positive value to add stock, or negative value (e.g. -5) to deduct.
            </p>
          </div>

          <div>
            <label className="block font-semibold mb-1">Mandatory Audit Reason *</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Daily harvest spoilage, physical count discrepancy, damaged spawn bag..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-stone-200 dark:border-spore-ivory/10">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-stone-200 dark:border-spore-ivory/20 px-4 py-2 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-spore-ivory/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-forest-primary px-5 py-2 text-xs font-bold text-spore-ivory hover:bg-forest-hover disabled:opacity-50"
            >
              {isSubmitting ? "Recording..." : "Save Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateItemForm({ onDone }: { onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-forest-primary px-4 py-2 font-display text-xs font-semibold text-spore-ivory hover:bg-forest-hover"
      >
        + Add Raw Material / Supply
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createInventoryItemAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to create inventory item.");
      return;
    }

    setOpen(false);
    onDone?.();
  };

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-base">New Inventory Item</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-stone-600 dark:text-spore-ivory/60 hover:text-stone-900 dark:hover:text-spore-ivory"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-alert-coral/15 border border-alert-coral/30 p-2 text-xs text-red-600 dark:text-alert-coral">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 text-xs">
        <div>
          <label className="block font-semibold mb-1">Item Name *</label>
          <input
            type="text"
            name="itemName"
            required
            placeholder="e.g. Master Oyster Spawn, Wheat Bran..."
            className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Category *</label>
          <select
            name="itemCategory"
            className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
          >
            <option value={ItemCategory.RAW_MATERIAL}>Raw Material (Spawn, Straw)</option>
            <option value={ItemCategory.PACKAGING}>Packaging (Poly bags, Boxes)</option>
            <option value={ItemCategory.EQUIPMENT}>Equipment & Tools</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Unit of Measure *</label>
          <input
            type="text"
            name="unit"
            defaultValue="KG"
            className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Opening Stock</label>
          <input
            type="number"
            step="0.01"
            name="openingStock"
            defaultValue="0"
            className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Reorder Alert Threshold</label>
          <input
            type="number"
            step="0.01"
            name="reorderThreshold"
            defaultValue="5"
            className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
          />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
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
            {isSubmitting ? "Saving..." : "Create Item"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function InventoryItemRow({
  item,
}: {
  item: {
    id: string;
    itemName: string;
    unit: string;
    itemCategory: ItemCategory;
    availableStockNum: number;
    reservedStockNum: number;
    sellableStockNum: number;
    reorderThresholdNum: number;
    isLowStock: boolean;
  };
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <tr className="hover:bg-stone-100 dark:hover:bg-spore-ivory/5 transition-colors">
        <td className="px-4 py-3 font-semibold text-stone-900 dark:text-spore-ivory">
          {item.itemName}
          {item.isLowStock && (
            <span className="ml-2 rounded-full bg-alert-coral/15 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-alert-coral">
              LOW STOCK
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-stone-600 dark:text-spore-ivory/60">
          <span className="rounded-full bg-stone-100 dark:bg-spore-ivory/10 px-2 py-0.5 font-semibold">
            {item.itemCategory.replace(/_/g, " ")}
          </span>
        </td>
        <td className="px-4 py-3 font-data font-bold text-stone-900 dark:text-spore-ivory">
          {item.availableStockNum} {item.unit}
        </td>
        <td className="px-4 py-3 font-data text-xs text-amber-700 dark:text-warning-amber">
          {item.reservedStockNum > 0 ? `${item.reservedStockNum} ${item.unit}` : "—"}
        </td>
        <td className="px-4 py-3 font-data font-bold text-green-700 dark:text-success-mint">
          {item.sellableStockNum} {item.unit}
        </td>
        <td className="px-4 py-3 font-data text-xs text-stone-600 dark:text-spore-ivory/50">
          ≤ {item.reorderThresholdNum} {item.unit}
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-surface-charcoal border border-stone-200 dark:border-spore-ivory/20 px-3 py-1 text-xs font-semibold hover:bg-forest-primary hover:border-forest-primary dark:hover:border-white/15 transition-colors cursor-pointer"
          >
            Adjust Stock
          </button>
        </td>
      </tr>

      {modalOpen && (
        <StockAdjustmentModal item={item} onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
