"use client";

import { useState } from "react";
import { createSupplierAction, createPurchaseAction } from "./actions";

export function CreateSupplierModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-spore-ivory/20 px-4 py-2 font-display text-xs font-semibold text-spore-ivory hover:bg-spore-ivory/5"
      >
        + Add New Supplier
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createSupplierAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to save supplier.");
      return;
    }

    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-body">
      <div className="w-full max-w-md rounded-2xl border border-spore-ivory/20 bg-surface-charcoal p-6 shadow-2xl text-spore-ivory space-y-4">
        <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-3">
          <h3 className="font-display font-bold text-lg">Add Raw Material Supplier</h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-spore-ivory/60 hover:text-spore-ivory"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-alert-coral/15 border border-alert-coral/30 p-2 text-xs text-alert-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Company / Supplier Name *</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Balasore Biomass & Straw"
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Contact Person</label>
            <input
              type="text"
              name="contactPerson"
              placeholder="e.g. Ramesh Nayak"
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="e.g. 9876543210"
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="supplier@example.com"
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Materials Supplied</label>
            <input
              type="text"
              name="materialsSupplied"
              defaultValue="Organic Paddy Straw, Grain Spawn, Bran"
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-spore-ivory/10">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-spore-ivory/20 px-4 py-2 font-semibold hover:bg-spore-ivory/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-forest-primary px-5 py-2 font-bold text-spore-ivory hover:bg-forest-hover disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreatePurchaseModal({
  suppliers,
}: {
  suppliers: Array<{ id: string; name: string }>;
}) {
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
        + Record Raw Material Purchase
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createPurchaseAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to save purchase.");
      return;
    }

    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-body">
      <div className="w-full max-w-lg rounded-2xl border border-spore-ivory/20 bg-surface-charcoal p-6 shadow-2xl text-spore-ivory space-y-4">
        <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-3">
          <div>
            <h3 className="font-display font-bold text-lg">Record Material Purchase</h3>
            <p className="text-xs text-spore-ivory/60">
              Inward stock updates raw material inventory automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-spore-ivory/60 hover:text-spore-ivory"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-alert-coral/15 border border-alert-coral/30 p-2 text-xs text-alert-coral">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold mb-1">Supplier *</label>
              <select
                name="supplierId"
                required
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Purchase Date *</label>
              <input
                type="date"
                name="purchaseDate"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Material Name *</label>
            <input
              type="text"
              name="materialName"
              required
              placeholder="e.g. Master Oyster Grain Spawn, Wheat Straw Bales..."
              className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold mb-1">Quantity *</label>
              <input
                type="number"
                step="0.1"
                name="quantity"
                required
                placeholder="e.g. 50"
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Unit</label>
              <input
                type="text"
                name="unit"
                defaultValue="KG"
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Rate / Unit (₹) *</label>
              <input
                type="number"
                step="0.01"
                name="unitPrice"
                required
                placeholder="e.g. 60"
                className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-spore-ivory/10">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-spore-ivory/20 px-4 py-2 font-semibold hover:bg-spore-ivory/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-forest-primary px-5 py-2 font-bold text-spore-ivory hover:bg-forest-hover disabled:opacity-50"
            >
              {isSubmitting ? "Receiving..." : "Receive Stock & Record PO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
