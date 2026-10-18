import { Suspense } from "react";
import { AdminNav } from "@/components/auth/admin-nav";

export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f7faf8] dark:bg-[#0b120f] text-stone-900 dark:text-spore-ivory transition-colors duration-200">
      <aside className="flex w-64 flex-col gap-6 border-r border-stone-200/80 dark:border-white/10 bg-white/90 dark:bg-[#101815]/95 backdrop-blur-md p-5 shrink-0 transition-colors">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-forest-primary text-lg font-bold text-spore-ivory shadow-xs">
            🍄
          </span>
          <div>
            <span className="font-display text-base font-bold text-forest-primary dark:text-spore-ivory block leading-tight">
              SporeERP
            </span>
            <span className="text-[10px] uppercase tracking-wider text-forest-primary/60 dark:text-spore-ivory/50 font-semibold">
              Operations Console
            </span>
          </div>
        </div>
        <Suspense fallback={null}>
          <AdminNav />
        </Suspense>
      </aside>
      <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-[1400px] w-full">{children}</main>
    </div>
  );
}
