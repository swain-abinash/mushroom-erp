import type { Metadata } from "next";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ProductionService } from "@/services/production.service";
import { formatDate } from "@/lib/utils";
import { RapidHarvestForm } from "./harvest-form";

export const instant = false;
export const metadata: Metadata = { title: "Harvest Logger & Quality — SporeERP Admin" };

export default async function AdminHarvestsPage() {
  await requirePermission(PERMISSIONS.HARVEST_LOG_ENTRY, "/admin/production/harvests");

  const [batches, harvests] = await Promise.all([
    ProductionService.listBatches(),
    ProductionService.listHarvests(25),
  ]);

  const activeBatches = batches.filter(
    (b) => b.status !== "COMPLETED" && b.status !== "CONTAMINATED",
  );

  return (
    <div className="flex flex-col gap-8 font-body text-stone-900 dark:text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-stone-600 dark:text-spore-ivory/60 mb-2">
            <Link href="/admin/production" className="hover:underline">
              Cultivation Hub
            </Link>{" "}
            / Harvests
          </nav>
          <h1 className="font-display text-2xl font-bold">Harvest Logging &amp; Quality Grading</h1>
          <p className="mt-1 text-sm text-stone-700 dark:text-spore-ivory/70">
            Rapid data entry for daily morning harvest, quality grading, and automated inventory sync.
          </p>
        </div>
      </header>

      {/* Rapid Harvest Entry Card */}
      {activeBatches.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-8 text-center text-stone-600 dark:text-spore-ivory/60 space-y-3">
          <p className="text-base font-bold text-stone-900 dark:text-spore-ivory">No Active Cultivation Batches</p>
          <p className="text-xs max-w-sm mx-auto">
            You need at least one active cultivation batch to log a harvest.
          </p>
          <Link
            href="/admin/production/batches"
            className="inline-block rounded-full bg-forest-primary px-6 py-2.5 font-display text-xs font-bold text-spore-ivory hover:bg-forest-hover"
          >
            + Create First Batch
          </Link>
        </div>
      ) : (
        <RapidHarvestForm
          batches={activeBatches.map((b) => ({
            id: b.id,
            batchNumber: b.batchNumber,
            mushroomType: b.mushroomType,
          }))}
        />
      )}

      {/* Harvest Ledger */}
      <section className="rounded-2xl border border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-stone-200 dark:border-spore-ivory/10 pb-3">
          <h2 className="font-display text-lg font-bold">Harvest History &amp; Quality Records</h2>
          <span className="text-xs text-stone-600 dark:text-spore-ivory/50">Showing last 25 flushes</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-stone-200 dark:border-spore-ivory/10 bg-white dark:bg-surface-charcoal/80 text-xs uppercase tracking-wide text-stone-600 dark:text-spore-ivory/60">
              <tr>
                <th className="px-4 py-3">Harvest Date</th>
                <th className="px-4 py-3">Batch Number</th>
                <th className="px-4 py-3">Flush</th>
                <th className="px-4 py-3">Total Yield</th>
                <th className="px-4 py-3">Grade A</th>
                <th className="px-4 py-3">Grade B</th>
                <th className="px-4 py-3">Dry / Grade C</th>
                <th className="px-4 py-3">Wastage</th>
                <th className="px-4 py-3">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-spore-ivory/10 text-xs">
              {harvests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-stone-600 dark:text-spore-ivory/50">
                    No harvests recorded yet. Use the rapid logger above.
                  </td>
                </tr>
              ) : (
                harvests.map((h) => (
                  <tr key={h.id} className="hover:bg-stone-100 dark:hover:bg-spore-ivory/5 transition-colors">
                    <td className="px-4 py-3 font-data text-stone-700 dark:text-spore-ivory/70">
                      {formatDate(h.harvestDate)}
                    </td>
                    <td className="px-4 py-3 font-data font-bold text-stone-900 dark:text-spore-ivory">
                      {h.batch.batchNumber}
                      <span className="block text-[11px] font-normal text-stone-600 dark:text-spore-ivory/50">
                        {h.batch.mushroomType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">Flush #{h.flushNumber}</td>
                    <td className="px-4 py-3 font-data font-bold text-green-700 dark:text-success-mint text-sm">
                      {Number(h.totalWeightKg)} KG
                    </td>
                    <td className="px-4 py-3 font-data text-stone-700 dark:text-spore-ivory/90">
                      {Number(h.gradeAKg)} KG
                    </td>
                    <td className="px-4 py-3 font-data text-stone-700 dark:text-spore-ivory/90">
                      {Number(h.gradeBKg)} KG
                    </td>
                    <td className="px-4 py-3 font-data text-amber-800 dark:text-shiitake-ochre">
                      {Number(h.gradeCDryKg)} KG
                    </td>
                    <td className="px-4 py-3 font-data text-red-600 dark:text-alert-coral">
                      {Number(h.wastageKg)} KG
                    </td>
                    <td className="px-4 py-3 text-stone-700 dark:text-spore-ivory/70">{h.recorder.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
