import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/dal";
import { ProductionService } from "@/services/production.service";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { BatchStatus } from "@prisma/client";
import { CreateBatchForm, BatchStatusSelect } from "./batch-forms";

export const instant = false;
export const metadata: Metadata = { title: "Production Batches — SporeERP Admin" };

export default async function AdminBatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireStaff("/admin/production/batches");

  const { status } = await searchParams;
  const statusFilter =
    status && Object.values(BatchStatus).includes(status as BatchStatus)
      ? (status as BatchStatus)
      : undefined;

  const [batches, rooms, suppliers] = await Promise.all([
    ProductionService.listBatches(statusFilter),
    ProductionService.listRooms(),
    db.supplier.findMany({ select: { id: true, name: true } }),
  ]);

  const statuses = [
    { value: "", label: "All Batches" },
    { value: BatchStatus.PREPARATION, label: "Preparation" },
    { value: BatchStatus.INCUBATION, label: "Incubation" },
    { value: BatchStatus.FRUITING, label: "Fruiting" },
    { value: BatchStatus.HARVESTING, label: "Harvesting" },
    { value: BatchStatus.COMPLETED, label: "Completed" },
    { value: BatchStatus.CONTAMINATED, label: "Contaminated" },
  ];

  return (
    <div className="flex flex-col gap-8 font-body text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-spore-ivory/60 mb-2">
            <Link href="/admin/production" className="hover:underline">
              Cultivation Hub
            </Link>{" "}
            / Batches
          </nav>
          <h1 className="font-display text-2xl font-bold">Production Batches</h1>
          <p className="mt-1 text-sm text-spore-ivory/70">
            End-to-end substrate preparation, spawn run, incubation, and flush harvest tracking.
          </p>
        </div>
        <CreateBatchForm
          rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
          suppliers={suppliers.map((s) => ({ id: s.id, name: s.name }))}
        />
      </header>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-spore-ivory/10 pb-3">
        {statuses.map((s) => {
          const active = (statusFilter ?? "") === s.value;
          return (
            <Link
              key={s.value}
              href={s.value ? `/admin/production/batches?status=${s.value}` : "/admin/production/batches"}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "bg-forest-primary text-spore-ivory"
                  : "bg-surface-charcoal border border-spore-ivory/10 text-spore-ivory/70 hover:text-spore-ivory"
              }`}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {/* Batches Table */}
      <section className="overflow-x-auto rounded-2xl border border-spore-ivory/10 bg-surface-charcoal">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-spore-ivory/10 bg-surface-charcoal/80 text-xs uppercase tracking-wide text-spore-ivory/60">
            <tr>
              <th className="px-4 py-3">Batch Number</th>
              <th className="px-4 py-3">Mushroom Variety</th>
              <th className="px-4 py-3">Beds</th>
              <th className="px-4 py-3">Spawn Supplier</th>
              <th className="px-4 py-3">Substrate (Dry)</th>
              <th className="px-4 py-3">Inoculated</th>
              <th className="px-4 py-3">Harvest Target</th>
              <th className="px-4 py-3">Total Yield</th>
              <th className="px-4 py-3">Bio. Efficiency</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-spore-ivory/10">
            {batches.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-12 text-center text-spore-ivory/60">
                  No batches found for this status. Create a new batch using the button above.
                </td>
              </tr>
            ) : (
              batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-spore-ivory/5 transition-colors">
                  <td className="px-4 py-3 font-data font-bold text-spore-ivory">
                    {batch.batchNumber}
                    <div className="text-[11px] font-normal text-spore-ivory/50">
                      by {batch.creator.name}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-spore-ivory">
                    {batch.mushroomType}
                  </td>
                  <td className="px-4 py-3 font-data text-xs">
                    {batch.numberOfBeds} beds
                  </td>
                  <td className="px-4 py-3 text-xs text-spore-ivory/70">
                    {batch.spawnSupplier?.name ?? "In-House"}
                  </td>
                  <td className="px-4 py-3 font-data text-xs">
                    {Number(batch.substrateDryWeightKg)} KG
                  </td>
                  <td className="px-4 py-3 font-data text-xs text-spore-ivory/70">
                    {formatDate(batch.inoculationDate)}
                  </td>
                  <td className="px-4 py-3 font-data text-xs text-warning-amber">
                    {formatDate(batch.expectedHarvestDate)}
                  </td>
                  <td className="px-4 py-3 font-data font-bold text-success-mint">
                    {Number(batch.totalHarvestedKg).toFixed(1)} KG
                  </td>
                  <td className="px-4 py-3 font-data text-xs text-spore-ivory/80">
                    {batch.biologicalEfficiency
                      ? `${Number(batch.biologicalEfficiency).toFixed(1)}%`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <BatchStatusSelect batchId={batch.id} currentStatus={batch.status} />
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
