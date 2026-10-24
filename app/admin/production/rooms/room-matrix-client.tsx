"use client";

import { useState } from "react";
import { updateBedStatusAction, createRoomAction } from "../actions";
import { BedStatus, RoomType } from "@prisma/client";

type BedItem = {
  id: string;
  rackIdentifier: string;
  bedIdentifier: string;
  status: BedStatus;
  contaminationType: string | null;
  spawnWeightGrams: number;
  batch: { batchNumber: string; mushroomType: string };
};

const BED_COLORS: Record<BedStatus, { bg: string; text: string; border: string }> = {
  COLONIZING: {
    bg: "bg-forest-primary/20",
    text: "text-stone-900 dark:text-spore-ivory",
    border: "border-forest-primary/40 dark:border-white/15",
  },
  PINNING: {
    bg: "bg-warning-amber/20",
    text: "text-amber-700 dark:text-warning-amber",
    border: "border-warning-amber/40",
  },
  FRUITING: {
    bg: "bg-success-mint/20",
    text: "text-green-700 dark:text-success-mint",
    border: "border-success-mint/50",
  },
  EXHAUSTED: {
    bg: "bg-white dark:bg-surface-charcoal/80",
    text: "text-stone-500 dark:text-spore-ivory/40",
    border: "border-stone-200 dark:border-spore-ivory/10",
  },
  CONTAMINATED: {
    bg: "bg-alert-coral/20",
    text: "text-red-600 dark:text-alert-coral",
    border: "border-alert-coral/50",
  },
};

export function RoomMatrixClient({
  beds,
}: {
  beds: BedItem[];
}) {
  const [activeBed, setActiveBed] = useState<BedItem | null>(null);

  // Group beds by rack
  const racks = beds.reduce((acc, bed) => {
    if (!acc[bed.rackIdentifier]) acc[bed.rackIdentifier] = [];
    acc[bed.rackIdentifier].push(bed);
    return acc;
  }, {} as Record<string, BedItem[]>);

  const handleStatusChange = async (bedId: string, status: BedStatus) => {
    const formData = new FormData();
    formData.append("bedId", bedId);
    formData.append("status", status);
    if (status === BedStatus.CONTAMINATED) {
      formData.append("contaminationType", "Trichoderma green mold detected");
    }
    await updateBedStatusAction(formData);
    setActiveBed(null);
  };

  return (
    <div className="space-y-6 font-body">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-4 text-xs">
        <span className="font-semibold text-stone-600 dark:text-spore-ivory/60 mr-2">Bed Statuses:</span>
        <span className="flex items-center gap-1.5 text-stone-900 dark:text-spore-ivory">
          <span className="size-3 rounded-sm bg-forest-primary/40 border border-forest-primary dark:border-white/15" />
          Colonizing (Spawn Run)
        </span>
        <span className="flex items-center gap-1.5 text-amber-700 dark:text-warning-amber">
          <span className="size-3 rounded-sm bg-warning-amber/40 border border-warning-amber" />
          Pinning (Baby Primordia)
        </span>
        <span className="flex items-center gap-1.5 text-green-700 dark:text-success-mint font-semibold">
          <span className="size-3 rounded-sm bg-success-mint/40 border border-success-mint" />
          Fruiting (Ready to Harvest!)
        </span>
        <span className="flex items-center gap-1.5 text-red-600 dark:text-alert-coral">
          <span className="size-3 rounded-sm bg-alert-coral/40 border border-alert-coral" />
          Contaminated (Quarantine)
        </span>
        <span className="flex items-center gap-1.5 text-stone-500 dark:text-spore-ivory/40">
          <span className="size-3 rounded-sm bg-white dark:bg-surface-charcoal border border-stone-200 dark:border-spore-ivory/20" />
          Exhausted (Spent Substrate)
        </span>
      </div>

      {/* Racks Grid */}
      {Object.keys(racks).length === 0 ? (
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-12 text-center text-stone-600 dark:text-spore-ivory/60">
          No beds provisioned in this room yet. Provision a new batch to allocate beds.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(racks).map(([rackName, rackBeds]) => (
            <div
              key={rackName}
              className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-3"
            >
              <div className="flex justify-between items-center border-b border-stone-200 dark:border-spore-ivory/10 pb-2">
                <h3 className="font-display font-bold text-sm text-stone-900 dark:text-spore-ivory">{rackName}</h3>
                <span className="text-xs text-stone-600 dark:text-spore-ivory/50">
                  {rackBeds.length} individual mushroom beds
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10 gap-2.5">
                {rackBeds.map((bed) => {
                  const style = BED_COLORS[bed.status] ?? BED_COLORS.COLONIZING;
                  return (
                    <button
                      key={bed.id}
                      type="button"
                      onClick={() => setActiveBed(bed)}
                      className={`flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all hover:scale-105 cursor-pointer shadow-xs ${style.bg} ${style.border} ${style.text}`}
                      title={`Batch: ${bed.batch.batchNumber} - ${bed.batch.mushroomType}`}
                    >
                      <span className="font-data font-bold text-xs">{bed.bedIdentifier}</span>
                      <span className="text-[10px] font-semibold mt-1 truncate max-w-full">
                        {bed.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bed Status Quick Edit Modal */}
      {activeBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-body">
          <div className="w-full max-w-sm rounded-2xl border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal p-6 shadow-2xl text-stone-900 dark:text-spore-ivory space-y-4">
            <div className="flex justify-between items-center border-b border-stone-200 dark:border-spore-ivory/10 pb-3">
              <div>
                <h3 className="font-display font-bold text-base">
                  {activeBed.rackIdentifier} — {activeBed.bedIdentifier}
                </h3>
                <p className="text-xs text-stone-600 dark:text-spore-ivory/60">
                  Batch: {activeBed.batch.batchNumber} ({activeBed.batch.mushroomType})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveBed(null)}
                className="text-stone-600 dark:text-spore-ivory/60 hover:text-stone-900 dark:hover:text-spore-ivory"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-700 dark:text-spore-ivory/70">
              Update cultivation stage as mycelium colonizes and pins fruit:
            </p>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleStatusChange(activeBed.id, BedStatus.COLONIZING)}
                className="rounded-lg border border-forest-primary/30 dark:border-white/15 p-2 text-left hover:bg-forest-primary/20"
              >
                🔵 <strong>Colonizing</strong> (Substrate spawn run)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(activeBed.id, BedStatus.PINNING)}
                className="rounded-lg border border-warning-amber/30 p-2 text-left hover:bg-warning-amber/20"
              >
                🟡 <strong>Pinning</strong> (Primordia formation)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(activeBed.id, BedStatus.FRUITING)}
                className="rounded-lg border border-success-mint/40 p-2 text-left hover:bg-success-mint/20 text-green-700 dark:text-success-mint"
              >
                🟢 <strong>Fruiting</strong> (Ready for harvest flush!)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(activeBed.id, BedStatus.CONTAMINATED)}
                className="rounded-lg border border-alert-coral/40 p-2 text-left hover:bg-alert-coral/20 text-red-600 dark:text-alert-coral"
              >
                🔴 <strong>Contaminated</strong> (Mark for quarantine removal)
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(activeBed.id, BedStatus.EXHAUSTED)}
                className="rounded-lg border border-stone-200 dark:border-spore-ivory/10 p-2 text-left hover:bg-stone-100 dark:hover:bg-spore-ivory/10 text-stone-600 dark:text-spore-ivory/50"
              >
                ⚪ <strong>Exhausted</strong> (Flushes finished)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function CreateRoomForm() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-stone-200 dark:border-spore-ivory/20 px-4 py-2 font-display text-xs font-semibold text-stone-900 dark:text-spore-ivory hover:bg-stone-100 dark:hover:bg-spore-ivory/5"
      >
        + Add Growing Room
      </button>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await createRoomAction(formData);
    setIsSubmitting(false);
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-5 space-y-4 font-body text-stone-900 dark:text-spore-ivory">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-bold text-base">New Growing Room</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-stone-600 dark:text-spore-ivory/60 hover:text-stone-900 dark:hover:text-spore-ivory"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2 text-xs">
        <div>
          <label className="block font-semibold mb-1">Room Name *</label>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. Fruiting Room 3"
            className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Room Purpose</label>
          <select
            name="roomType"
            className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
          >
            <option value={RoomType.FRUITING}>Fruiting Room</option>
            <option value={RoomType.INCUBATION}>Incubation Room</option>
            <option value={RoomType.SPAWN_LAB}>Spawn Lab</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Target Temperature (°C)</label>
          <input
            type="number"
            step="0.5"
            name="targetTempC"
            defaultValue="24.0"
            className="w-full rounded-lg border border-stone-200 dark:border-spore-ivory/20 bg-white dark:bg-surface-charcoal px-3 py-2 text-stone-900 dark:text-spore-ivory focus:border-forest-primary dark:focus:border-white/15 focus:outline-hidden"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Target Relative Humidity (%)</label>
          <input
            type="number"
            step="1"
            name="targetHumidity"
            defaultValue="85.0"
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
            {isSubmitting ? "Creating..." : "Save Room"}
          </button>
        </div>
      </form>
    </div>
  );
}
