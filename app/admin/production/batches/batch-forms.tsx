"use client";

import { useState } from "react";
import { createBatchAction, updateBatchStatusAction } from "../actions";
import { BatchStatus } from "@prisma/client";

export function CreateBatchForm({
  rooms,
  suppliers,
}: {
  rooms: Array<{ id: string; name: string }>;
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
        + Create Cultivation Batch
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createBatchAction(formData);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error ?? "Failed to create cultivation batch.");
      return;
    }

    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 space-y-4 font-body">
      <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-3">
        <div>
          <h3 className="font-display font-bold text-lg text-spore-ivory">
            Start New Production Batch
          </h3>
          <p className="text-xs text-spore-ivory/60">
            Initializes spawn inoculation and automatically provisions bed records in the growing room.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-spore-ivory/60 hover:text-spore-ivory"
        >
          ✕ Cancel
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-alert-coral/15 border border-alert-coral/30 p-2.5 text-xs text-alert-coral">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 text-xs text-spore-ivory">
        <div>
          <label className="block font-semibold mb-1">Mushroom Variety *</label>
          <select
            name="mushroomType"
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          >
            <option value="Blue Oyster">Blue Oyster (Pleurotus columbinus)</option>
            <option value="Pink Oyster">Pink Oyster (Pleurotus djamor)</option>
            <option value="King Oyster">King Oyster (Pleurotus eryngii)</option>
            <option value="White Milky">White Milky (Calocybe indica)</option>
            <option value="Paddy Straw">Paddy Straw (Volvariella volvacea)</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Target Growing Room *</label>
          <select
            name="roomId"
            required
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Spawn Supplier (Optional)</label>
          <select
            name="spawnSupplierId"
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          >
            <option value="">In-House / None</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold mb-1">Spawn Inoculated (KG) *</label>
          <input
            type="number"
            step="0.1"
            name="spawnQuantityKg"
            required
            defaultValue="5.0"
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Substrate Formulation</label>
          <input
            type="text"
            name="substrateType"
            defaultValue="Paddy Straw + Wheat Bran"
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Substrate Dry Weight (KG) *</label>
          <input
            type="number"
            step="0.5"
            name="substrateDryWeightKg"
            required
            defaultValue="50.0"
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Number of Beds to Provision *</label>
          <input
            type="number"
            name="numberOfBeds"
            required
            defaultValue="20"
            min="1"
            max="100"
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Inoculation Date *</label>
          <input
            type="date"
            name="inoculationDate"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Expected Days to Harvest</label>
          <input
            type="number"
            name="expectedHarvestDays"
            defaultValue="21"
            className="w-full rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-3 py-2 text-spore-ivory focus:border-forest-primary focus:outline-hidden"
          />
        </div>

        <div className="sm:col-span-2 flex justify-end gap-2 pt-3 border-t border-spore-ivory/10">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-spore-ivory/20 px-5 py-2 font-semibold hover:bg-spore-ivory/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-forest-primary px-6 py-2 font-bold text-spore-ivory hover:bg-forest-hover disabled:opacity-50"
          >
            {isSubmitting ? "Provisioning..." : "Launch Batch & Provision Beds"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function BatchStatusSelect({
  batchId,
  currentStatus,
}: {
  batchId: string;
  currentStatus: BatchStatus;
}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = e.target.value as BatchStatus;
    if (nextStatus === currentStatus) return;

    setIsUpdating(true);
    const formData = new FormData();
    formData.append("batchId", batchId);
    formData.append("status", nextStatus);
    await updateBatchStatusAction(formData);
    setIsUpdating(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={currentStatus}
        disabled={isUpdating}
        onChange={handleChange}
        className="rounded-lg border border-spore-ivory/20 bg-surface-charcoal px-2.5 py-1 text-xs text-spore-ivory focus:border-forest-primary focus:outline-hidden disabled:opacity-50"
      >
        <option value={BatchStatus.PLANNED}>Planned</option>
        <option value={BatchStatus.PREPARATION}>Preparation</option>
        <option value={BatchStatus.SPAWNING}>Spawning</option>
        <option value={BatchStatus.INCUBATION}>Incubation</option>
        <option value={BatchStatus.FRUITING}>Fruiting</option>
        <option value={BatchStatus.HARVESTING}>Harvesting</option>
        <option value={BatchStatus.COMPLETED}>Completed</option>
        <option value={BatchStatus.CONTAMINATED}>Contaminated (Loss)</option>
      </select>
      {isUpdating && <span className="text-[10px] text-spore-ivory/50">...</span>}
    </div>
  );
}
