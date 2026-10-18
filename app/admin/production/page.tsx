import type { Metadata } from "next";
import Link from "next/link";
import { requireStaff } from "@/lib/auth/dal";
import { ProductionService } from "@/services/production.service";
import { formatDate } from "@/lib/utils";

export const instant = false;
export const metadata: Metadata = { title: "Cultivation & Agronomy — SporeERP Admin" };

export default async function ProductionDashboardPage() {
  await requireStaff("/admin/production");

  const [batches, rooms, harvests] = await Promise.all([
    ProductionService.listBatches(),
    ProductionService.listRooms(),
    ProductionService.listHarvests(5),
  ]);

  const activeBatches = batches.filter(
    (b) => b.status !== "COMPLETED" && b.status !== "CONTAMINATED",
  );
  const totalHarvestKg = batches.reduce((sum, b) => sum + Number(b.totalHarvestedKg), 0);
  const totalBeds = rooms.reduce((sum, r) => sum + r._count.beds, 0);

  return (
    <div className="flex flex-col gap-8 font-body text-spore-ivory">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Mushroom Cultivation & Agronomy</h1>
          <p className="mt-1 text-sm text-spore-ivory/70">
            Batch lifecycle tracking, room environmental monitoring, and rapid harvest quality logging.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/production/harvests"
            className="rounded-full bg-success-mint px-5 py-2 text-xs font-bold text-surface-charcoal hover:bg-success-mint/90 transition-colors"
          >
            🍄 + Log Harvest (&lt;30s)
          </Link>
          <Link
            href="/admin/production/batches"
            className="rounded-full bg-forest-primary px-5 py-2 text-xs font-bold text-spore-ivory hover:bg-forest-hover transition-colors"
          >
            + New Batch
          </Link>
        </div>
      </header>

      {/* Quick Navigation Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Link
          href="/admin/production/batches"
          className="group rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 transition-all hover:border-forest-primary/50 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🌱</span>
            <span className="font-data text-xl font-bold text-spore-ivory">
              {activeBatches.length} Active
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-spore-ivory group-hover:text-success-mint">
            Production Batches →
          </h3>
          <p className="mt-1 text-xs text-spore-ivory/60">
            Track spawn inoculation, substrate weight, incubation timing, and biological efficiency.
          </p>
        </Link>

        <Link
          href="/admin/production/rooms"
          className="group rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 transition-all hover:border-forest-primary/50 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🪟</span>
            <span className="font-data text-xl font-bold text-spore-ivory">
              {totalBeds} Active Beds
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-spore-ivory group-hover:text-success-mint">
            Growing Rooms & Beds →
          </h3>
          <p className="mt-1 text-xs text-spore-ivory/60">
            Interactive visual grid of fruiting racks, pinning stages, and bed contamination quarantine.
          </p>
        </Link>

        <Link
          href="/admin/production/harvests"
          className="group rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 transition-all hover:border-forest-primary/50 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🧺</span>
            <span className="font-data text-xl font-bold text-success-mint">
              {totalHarvestKg.toFixed(1)} KG
            </span>
          </div>
          <h3 className="font-display text-lg font-bold text-spore-ivory group-hover:text-success-mint">
            Harvest Logger & Quality →
          </h3>
          <p className="mt-1 text-xs text-spore-ivory/60">
            Fast logging of Flush #1–3, quality grading (A/B/C/Wastage), and auto-inventory sync.
          </p>
        </Link>
      </div>

      {/* Active Batches Snapshot */}
      <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-3">
          <h2 className="font-display text-lg font-bold">Active Cultivation Pipeline</h2>
          <Link
            href="/admin/production/batches"
            className="text-xs text-forest-primary/90 hover:underline"
          >
            View all batches →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-spore-ivory/10 text-spore-ivory/60 uppercase">
              <tr>
                <th className="py-2.5">Batch #</th>
                <th className="py-2.5">Mushroom Type</th>
                <th className="py-2.5">Beds</th>
                <th className="py-2.5">Inoculated</th>
                <th className="py-2.5">Expected Harvest</th>
                <th className="py-2.5">Harvested</th>
                <th className="py-2.5">Bio. Efficiency</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spore-ivory/10">
              {activeBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-spore-ivory/50">
                    No active batches. Click &quot;+ New Batch&quot; above to start a harvest cycle.
                  </td>
                </tr>
              ) : (
                activeBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-spore-ivory/5">
                    <td className="py-2.5 font-data font-bold text-spore-ivory">
                      {b.batchNumber}
                    </td>
                    <td className="py-2.5 font-semibold text-spore-ivory">{b.mushroomType}</td>
                    <td className="py-2.5 font-data">{b.numberOfBeds} beds</td>
                    <td className="py-2.5 font-data text-spore-ivory/70">
                      {formatDate(b.inoculationDate)}
                    </td>
                    <td className="py-2.5 font-data text-warning-amber">
                      {formatDate(b.expectedHarvestDate)}
                    </td>
                    <td className="py-2.5 font-data font-bold text-success-mint">
                      {Number(b.totalHarvestedKg).toFixed(1)} KG
                    </td>
                    <td className="py-2.5 font-data text-spore-ivory/80">
                      {b.biologicalEfficiency ? `${Number(b.biologicalEfficiency).toFixed(1)}%` : "—"}
                    </td>
                    <td className="py-2.5">
                      <span className="rounded-full bg-forest-primary/20 px-2 py-0.5 text-[10px] font-bold text-spore-ivory">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Harvests */}
      <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-spore-ivory/10 pb-3">
          <h2 className="font-display text-lg font-bold">Recent Harvest Logs</h2>
          <Link
            href="/admin/production/harvests"
            className="text-xs text-forest-primary/90 hover:underline"
          >
            Open harvest logger →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-spore-ivory/10 text-spore-ivory/60 uppercase">
              <tr>
                <th className="py-2">Date</th>
                <th className="py-2">Batch</th>
                <th className="py-2">Flush</th>
                <th className="py-2">Total Yield</th>
                <th className="py-2">Grade A (Premium)</th>
                <th className="py-2">Grade B (Button)</th>
                <th className="py-2">Wastage</th>
                <th className="py-2">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-spore-ivory/10">
              {harvests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-spore-ivory/50">
                    No harvests recorded yet.
                  </td>
                </tr>
              ) : (
                harvests.map((h) => (
                  <tr key={h.id}>
                    <td className="py-2 font-data text-spore-ivory/60">{formatDate(h.harvestDate)}</td>
                    <td className="py-2 font-bold text-spore-ivory">{h.batch.batchNumber}</td>
                    <td className="py-2 font-data">Flush #{h.flushNumber}</td>
                    <td className="py-2 font-data font-bold text-success-mint">
                      {Number(h.totalWeightKg)} KG
                    </td>
                    <td className="py-2 font-data text-spore-ivory/80">{Number(h.gradeAKg)} KG</td>
                    <td className="py-2 font-data text-spore-ivory/80">{Number(h.gradeBKg)} KG</td>
                    <td className="py-2 font-data text-alert-coral">{Number(h.wastageKg)} KG</td>
                    <td className="py-2 text-spore-ivory/60">{h.recorder.name}</td>
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
