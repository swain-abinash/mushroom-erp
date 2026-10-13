import Link from "next/link";
import { Suspense } from "react";
import { UserNav } from "@/components/auth/user-nav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-spore-ivory">
      <header className="flex items-center justify-between border-b border-forest-primary/10 px-6 py-4">
        <Link href="/" className="font-display text-xl font-bold text-forest-primary">
          🍄 SporeERP
        </Link>
        <nav className="flex items-center gap-6 font-body text-sm text-forest-primary/80">
          <span>Products · Recipes · About · B2B Wholesale</span>
          <Suspense fallback={<span className="w-16" />}>
            <UserNav />
          </Suspense>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-forest-primary/10 px-6 py-4 text-center font-body text-xs text-forest-primary/60">
        © <CopyrightYear /> SporeERP — Fresh Farm Harvest to Your Kitchen.
      </footer>
    </div>
  );
}

async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}
