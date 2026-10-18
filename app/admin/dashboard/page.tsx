import Link from "next/link";
import { requireStaff } from "@/lib/auth/dal";
import { ROLE_DEFINITIONS, type RoleName } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { FinanceService } from "@/services/finance.service";
import { ProductionService } from "@/services/production.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CommandPaletteTrigger } from "@/components/command/command-palette";

export const instant = false;

function TrendSparkline({ isPositive = true }: { isPositive?: boolean }) {
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";
  const fillColor = isPositive ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)";

  return (
    <svg className="w-full h-10 overflow-visible" viewBox="0 0 240 40" fill="none">
      <defs>
        <linearGradient id="bentoSparklineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M 0 34 Q 30 30 60 32 T 120 22 T 170 16 T 210 10 T 240 4 L 240 40 L 0 40 Z"
        fill="url(#bentoSparklineGrad)"
      />
      <path
        d="M 0 34 Q 30 30 60 32 T 120 22 T 170 16 T 210 10 T 240 4"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [user, { error }] = await Promise.all([requireStaff(), searchParams]);
  const roleNames = user.roles.map(
    (role) => ROLE_DEFINITIONS[role as RoleName]?.displayName ?? role,
  );

  const [
    pnl,
    pendingOrdersCount,
    finishedStock,
    activeBatches,
    recentOrders,
    rooms,
    slotBreakdown,
  ] = await Promise.all([
    FinanceService.getProfitAndLoss("all"),
    db.order.count({
      where: { orderStatus: { in: ["CONFIRMED", "PROCESSING", "PACKED"] } },
    }),
    db.inventoryItem.aggregate({
      where: { itemCategory: "FINISHED_PRODUCT" },
      _sum: { availableStock: true, reservedStock: true },
    }),
    db.productionBatch.count({
      where: { status: { notIn: ["COMPLETED", "CONTAMINATED"] } },
    }),
    db.order.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { include: { user: { select: { name: true } } } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    ProductionService.listRooms(),
    db.order.groupBy({
      by: ["deliverySlot"],
      where: { orderStatus: { in: ["CONFIRMED", "PROCESSING", "PACKED"] } },
      _count: true,
    }),
  ]);

  const availableKg = Number(finishedStock._sum.availableStock ?? 0);
  const reservedKg = Number(finishedStock._sum.reservedStock ?? 0);
  const sellableKg = Math.max(0, availableKg - reservedKg);
  const totalStockKg = availableKg;
  const stockRatioPercent =
    totalStockKg > 0 ? Math.min(100, Math.round((sellableKg / totalStockKg) * 100)) : 0;

  const morningOrders =
    slotBreakdown.find((s) => s.deliverySlot === "MORNING_HARVEST_DISPATCH")?._count ?? 0;
  const eveningOrders =
    slotBreakdown.find((s) => s.deliverySlot === "EVENING_FRESH_DISPATCH")?._count ?? 0;

  const netMarginPercent =
    pnl.salesRevenue > 0 ? Math.round((pnl.netProfit / pnl.salesRevenue) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 font-body text-stone-900 dark:text-spore-ivory">
      {/* Alert if restricted permission access */}
      {error === "restricted" ? (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-2xl bg-alert-coral/10 border border-alert-coral/20 px-4 py-3 text-xs text-alert-coral font-medium"
        >
          <span>⚠️</span>
          <span>That section is restricted to Founder Administrators.</span>
        </div>
      ) : null}

      {/* Top Command Header & Telemetry Status Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-5 sm:p-6 backdrop-blur-md shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-white">
              Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-radar-dot" />
              Live Farm Sync
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-500 dark:text-spore-ivory/60">
            Welcome back, <strong className="text-stone-800 dark:text-spore-ivory">{user.name}</strong> ·{" "}
            <span className="text-forest-primary dark:text-success-mint font-semibold">
              {roleNames.join(", ")}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <CommandPaletteTrigger />
          <Link
            href="/admin/production/harvests"
            className="inline-flex items-center gap-1.5 rounded-full bg-success-mint px-3.5 py-2 font-bold text-surface-charcoal hover:bg-success-mint/90 shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span>🍄</span>
            <span>+ Log Harvest</span>
          </Link>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-full bg-forest-primary px-3.5 py-2 font-bold text-spore-ivory hover:bg-forest-hover shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <span>📦</span>
            <span>Fulfill Queue ({pendingOrdersCount})</span>
          </Link>
          <Link
            href="/admin/expenses"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 dark:border-white/15 bg-stone-100/70 dark:bg-white/5 px-3.5 py-2 font-semibold text-stone-700 dark:text-spore-ivory hover:bg-stone-200/80 dark:hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          >
            <span>💸</span>
            <span>+ Expense</span>
          </Link>
        </div>
      </header>

      {/* Modern Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Bento Tile 1: Financial Health & Profit Trajectory (Spans 2 columns on XL) */}
        <div className="xl:col-span-2 flex flex-col justify-between rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-surface-charcoal/80 p-6 backdrop-blur-md shadow-xs transition-all hover:border-emerald-500/30">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-spore-ivory/50">
                Financial Performance · All-Time Net Margin
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  pnl.netProfit >= 0
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                }`}
              >
                {pnl.netProfit >= 0 ? "↗" : "↘"} {netMarginPercent}% Margin
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span
                className={`font-data text-3xl sm:text-4xl font-extrabold tracking-tight ${
                  pnl.netProfit >= 0
                    ? "text-emerald-600 dark:text-success-mint"
                    : "text-red-600 dark:text-alert-coral"
                }`}
              >
                {formatCurrency(pnl.netProfit)}
              </span>
              <span className="text-xs text-stone-500 dark:text-spore-ivory/50">
                Net Profit after COGS &amp; OPEX
              </span>
            </div>

            {/* Sparkline Visual Curve */}
            <div className="mt-2 py-1">
              <TrendSparkline isPositive={pnl.netProfit >= 0} />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-stone-200/80 dark:border-white/10 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-[10px] uppercase font-semibold text-stone-400 dark:text-spore-ivory/40">
                Gross Revenue
              </p>
              <p className="font-data font-bold text-stone-800 dark:text-spore-ivory mt-0.5 truncate">
                {formatCurrency(pnl.salesRevenue)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-stone-400 dark:text-spore-ivory/40">
                Total COGS
              </p>
              <p className="font-data font-bold text-stone-800 dark:text-spore-ivory mt-0.5 truncate">
                {formatCurrency(pnl.cogs)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold text-stone-400 dark:text-spore-ivory/40">
                Farm OPEX
              </p>
              <p className="font-data font-bold text-stone-800 dark:text-spore-ivory mt-0.5 truncate">
                {formatCurrency(pnl.totalOperatingExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Bento Tile 2: Harvest & Sellable Finished Stock (1 col) */}
        <Link
          href="/admin/inventory"
          className="group flex flex-col justify-between rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-surface-charcoal/80 p-6 backdrop-blur-md shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-spore-ivory/50">
                Sellable Stock
              </span>
              <span className="text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-stone-400">
                ↗
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-data text-3xl font-extrabold text-emerald-600 dark:text-success-mint">
                {sellableKg.toFixed(1)}
              </span>
              <span className="font-bold text-stone-500 dark:text-spore-ivory/60 text-sm">KG</span>
            </div>

            <p className="mt-1 text-xs text-stone-500 dark:text-spore-ivory/60">
              Fresh &amp; ready for customer delivery
            </p>

            {/* Visual Stock Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-stone-400 dark:text-spore-ivory/40 mb-1 font-semibold">
                <span>Free: {sellableKg.toFixed(1)} KG</span>
                <span>Reserved: {reservedKg.toFixed(1)} KG</span>
              </div>
              <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${stockRatioPercent}%` }}
                />
                <div
                  className="h-full bg-amber-500/80 transition-all duration-500"
                  style={{ width: `${100 - stockRatioPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-stone-500 dark:text-spore-ivory/50">
              Total: {totalStockKg.toFixed(1)} KG
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              Audit Stock →
            </span>
          </div>
        </Link>

        {/* Bento Tile 3: Pending Dispatch Queue (1 col) */}
        <Link
          href="/admin/orders"
          className="group flex flex-col justify-between rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-surface-charcoal/80 p-6 backdrop-blur-md shadow-xs transition-all hover:border-amber-500/40 hover:shadow-md cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-spore-ivory/50">
                Pending Dispatch
              </span>
              <span className="text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-stone-400">
                ↗
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-data text-3xl font-extrabold text-amber-500 dark:text-warning-amber">
                {pendingOrdersCount}
              </span>
              <span className="font-bold text-stone-500 dark:text-spore-ivory/60 text-sm">
                Orders
              </span>
            </div>

            <p className="mt-1 text-xs text-stone-500 dark:text-spore-ivory/60">
              Awaiting packing &amp; slot courier dispatch
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between rounded-xl bg-stone-100 dark:bg-white/5 px-2.5 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 text-stone-600 dark:text-spore-ivory/80">
                  <span>🌅</span>
                  <span>Morning Harvest</span>
                </span>
                <span className="font-data font-bold text-amber-600 dark:text-amber-400">
                  {morningOrders}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-stone-100 dark:bg-white/5 px-2.5 py-1.5 text-xs">
                <span className="flex items-center gap-1.5 text-stone-600 dark:text-spore-ivory/80">
                  <span>🌆</span>
                  <span>Evening Slot</span>
                </span>
                <span className="font-data font-bold text-stone-700 dark:text-spore-ivory">
                  {eveningOrders}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-stone-500 dark:text-spore-ivory/50">Order Fulfillment</span>
            <span className="font-bold text-amber-600 dark:text-amber-400">
              Open Queue →
            </span>
          </div>
        </Link>

        {/* Bento Tile 4: Active Grow Batches & Pipeline (1 col) */}
        <Link
          href="/admin/production/batches"
          className="group flex flex-col justify-between rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-surface-charcoal/80 p-6 backdrop-blur-md shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-spore-ivory/50">
                Active Cultivation
              </span>
              <span className="text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-stone-400">
                ↗
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-data text-3xl font-extrabold text-stone-900 dark:text-spore-ivory">
                {activeBatches}
              </span>
              <span className="font-bold text-stone-500 dark:text-spore-ivory/60 text-sm">
                Batches
              </span>
            </div>

            <p className="mt-1 text-xs text-stone-500 dark:text-spore-ivory/60">
              In substrate colonization &amp; fruiting
            </p>

            {/* Pipeline Stage Indicators */}
            <div className="mt-4 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-stone-600 dark:text-spore-ivory/80 font-medium">
                  Fruiting Stage (Daily Flushes)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-blue-500" />
                <span className="text-stone-600 dark:text-spore-ivory/80 font-medium">
                  Incubation (Spawn Run)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="text-stone-600 dark:text-spore-ivory/80 font-medium">
                  Pinning Initiated
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-stone-500 dark:text-spore-ivory/50">Grow Rooms</span>
            <span className="font-bold text-forest-primary dark:text-success-mint">
              View Batches →
            </span>
          </div>
        </Link>

        {/* Bento Tile 5: Growing Room Telemetry (1 col) */}
        <Link
          href="/admin/production/rooms"
          className="group flex flex-col justify-between rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-surface-charcoal/80 p-6 backdrop-blur-md shadow-xs transition-all hover:border-emerald-500/40 hover:shadow-md cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-spore-ivory/50">
                Climate Telemetry
              </span>
              <span className="text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-stone-400">
                ↗
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-data text-3xl font-extrabold text-stone-900 dark:text-spore-ivory">
                {rooms.length}
              </span>
              <span className="font-bold text-stone-500 dark:text-spore-ivory/60 text-sm">
                Rooms
              </span>
            </div>

            <p className="mt-1 text-xs text-stone-500 dark:text-spore-ivory/60">
              Active environmental chambers
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {rooms.slice(0, 2).map((room) => (
                <div
                  key={room.id}
                  className="rounded-xl border border-stone-200/70 dark:border-white/10 bg-stone-50/80 dark:bg-white/5 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-800 dark:text-spore-ivory truncate max-w-[120px]">
                      {room.name}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      ● Active
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[11px] text-stone-500 dark:text-spore-ivory/60 font-data">
                    <span>🌡️ {Number(room.targetTempC).toFixed(1)}°C</span>
                    <span>💧 {Number(room.targetHumidity).toFixed(0)}% RH</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between text-[11px]">
            <span className="text-stone-500 dark:text-spore-ivory/50">Bed Matrix</span>
            <span className="font-bold text-forest-primary dark:text-success-mint">
              Inspect Beds →
            </span>
          </div>
        </Link>

        {/* Bento Tile 6: Quick Action Command Launcher (2 cols on XL) */}
        <div className="xl:col-span-2 flex flex-col justify-between rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-surface-charcoal/80 p-6 backdrop-blur-md shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 dark:text-spore-ivory/50">
                Operations Launchpad · Instant Actions
              </span>
              <span className="text-[10px] text-stone-400 dark:text-spore-ivory/40">
                Single-click workflows
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <Link
                href="/admin/products/new"
                className="group flex items-center gap-3 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-3 hover:border-forest-primary/50 dark:hover:border-success-mint/50 hover:bg-forest-primary/5 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-forest-primary/10 dark:bg-white/10 text-lg group-hover:scale-110 transition-transform">
                  🍄
                </span>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-spore-ivory">
                    New Product
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-spore-ivory/50">
                    Add mushroom variety
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/production/batches"
                className="group flex items-center gap-3 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-3 hover:border-emerald-500/50 dark:hover:border-success-mint/50 hover:bg-emerald-500/5 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-lg group-hover:scale-110 transition-transform">
                  🌱
                </span>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-spore-ivory">
                    Spawn Batch
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-spore-ivory/50">
                    Inoculate substrate
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/purchases"
                className="group flex items-center gap-3 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-3 hover:border-blue-500/50 dark:hover:border-blue-400/50 hover:bg-blue-500/5 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-lg group-hover:scale-110 transition-transform">
                  🛒
                </span>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-spore-ivory">
                    Raw Materials PO
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-spore-ivory/50">
                    Order bags, spawn, hay
                  </p>
                </div>
              </Link>

              <Link
                href="/admin/reports/pnl"
                className="group flex items-center gap-3 rounded-2xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-3 hover:border-purple-500/50 dark:hover:border-purple-400/50 hover:bg-purple-500/5 dark:hover:bg-white/10 transition-all cursor-pointer"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-lg group-hover:scale-110 transition-transform">
                  📈
                </span>
                <div>
                  <p className="text-xs font-bold text-stone-900 dark:text-spore-ivory">
                    Audit P&amp;L
                  </p>
                  <p className="text-[10px] text-stone-500 dark:text-spore-ivory/50">
                    Breakdown unit costs
                  </p>
                </div>
              </Link>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between text-[11px] text-stone-500 dark:text-spore-ivory/50">
            <span>Keyboard shortcut tip: Press <kbd className="px-1.5 py-0.5 rounded bg-stone-200 dark:bg-white/10 font-data text-[10px]">Ctrl+K</kbd> to open Command Palette</span>
          </div>
        </div>
      </div>

      {/* Live Orders Feed & Customer Stream */}
      <section className="rounded-3xl border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-surface-charcoal/80 p-6 backdrop-blur-md shadow-xs space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-stone-200/80 dark:border-white/10 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-stone-900 dark:text-spore-ivory">
              Live Harvest Orders Stream
            </h2>
            <p className="text-xs text-stone-500 dark:text-spore-ivory/60">
              Real-time customer orders placed via the storefront requiring packing &amp; dispatch
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-forest-primary dark:text-success-mint hover:underline"
          >
            <span>View All Orders Queue</span>
            <span>→</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-stone-200/80 dark:border-white/10 text-stone-400 dark:text-spore-ivory/50 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3">Order Number</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Mushrooms Ordered</th>
                <th className="py-3 px-3">Dispatch Slot</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3">Fulfillment Status</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 dark:divide-white/10">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-stone-400 dark:text-spore-ivory/40">
                    No active orders placed yet. Customers can order fresh mushrooms on the storefront.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => {
                  const customerName = order.customer?.user?.name ?? "Guest Customer";
                  const initial = (customerName[0] || "C").toUpperCase();

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-stone-50/80 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3 px-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-data font-bold text-stone-900 dark:text-spore-ivory hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <div className="text-[10px] text-stone-400 dark:text-spore-ivory/40">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="flex size-6 items-center justify-center rounded-full bg-forest-primary/10 dark:bg-white/10 text-[10px] font-bold text-forest-primary dark:text-spore-ivory">
                            {initial}
                          </span>
                          <span className="font-semibold text-stone-800 dark:text-spore-ivory">
                            {customerName}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {order.items.map((item, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-stone-100 dark:bg-white/5 border border-stone-200/60 dark:border-white/10 px-1.5 py-0.5 text-[10px] text-stone-700 dark:text-spore-ivory/80 font-medium truncate max-w-[180px]"
                            >
                              {item.product.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            order.deliverySlot === "MORNING_HARVEST_DISPATCH"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                              : "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20"
                          }`}
                        >
                          <span>{order.deliverySlot === "MORNING_HARVEST_DISPATCH" ? "🌅" : "🌆"}</span>
                          <span>
                            {order.deliverySlot === "MORNING_HARVEST_DISPATCH"
                              ? "Morning 7-10 AM"
                              : "Evening 4-7 PM"}
                          </span>
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-data font-bold text-stone-900 dark:text-spore-ivory">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            order.orderStatus === "CONFIRMED"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20"
                              : order.orderStatus === "PROCESSING"
                              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                              : order.orderStatus === "PACKED"
                              ? "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20"
                              : order.orderStatus === "DELIVERED"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-stone-500/10 text-stone-700 dark:text-stone-300 border border-stone-500/20"
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-white/5 px-2.5 py-1 text-[11px] font-bold text-stone-800 dark:text-spore-ivory hover:bg-forest-primary hover:text-white dark:hover:bg-success-mint dark:hover:text-surface-charcoal transition-all shadow-2xs"
                        >
                          <span>Fulfill</span>
                          <span>→</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
