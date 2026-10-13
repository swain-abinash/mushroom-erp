import { Suspense } from "react";
import { AdminNav } from "@/components/auth/admin-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-charcoal-dark text-spore-ivory">
      <aside className="flex w-60 flex-col gap-8 border-r border-spore-ivory/10 p-6">
        <span className="font-display text-lg font-bold">SporeERP Admin</span>
        <Suspense fallback={null}>
          <AdminNav />
        </Suspense>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
