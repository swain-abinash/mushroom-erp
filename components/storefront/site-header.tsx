import Link from "next/link";
import { Suspense } from "react";
import { UserNav } from "@/components/auth/user-nav";
import { getStoreSettings } from "@/lib/settings";
import { CartButton } from "@/components/cart/cart-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CommandPaletteTrigger } from "@/components/command/command-palette";

export const NAV_LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/#varieties", label: "Varieties" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#business", label: "For business" },
  { href: "/#faq", label: "FAQ" },
];

export async function SiteHeader() {
  const { store_name } = await getStoreSettings();

  return (
    <header className="sticky top-0 z-40 border-b border-forest-primary/10 dark:border-white/10 bg-spore-ivory/90 dark:bg-[#0b120f]/90 backdrop-blur transition-colors duration-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="font-display text-xl font-bold text-forest-primary dark:text-spore-ivory transition-colors">
          🍄 {store_name}
        </Link>

        <nav
          aria-label="Main"
          className="hidden items-center gap-6 font-body text-sm text-forest-primary/80 dark:text-spore-ivory/80 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="underline-offset-4 hover:text-forest-primary dark:hover:text-spore-ivory hover:underline transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 font-body text-sm text-forest-primary dark:text-spore-ivory">
          <CommandPaletteTrigger />
          <ThemeToggle />
          <CartButton />
          <Suspense fallback={<div className="h-9 w-24 rounded-full bg-forest-primary/5 dark:bg-white/5 animate-pulse" />}>
            <UserNav />
          </Suspense>
          <details className="relative md:hidden">
            <summary
              className="cursor-pointer list-none rounded-lg border border-forest-primary/20 dark:border-white/20 px-3 py-1.5"
              aria-label="Menu"
            >
              ☰
            </summary>
            <nav
              aria-label="Mobile"
              className="absolute right-0 mt-2 flex w-48 flex-col rounded-xl border border-forest-primary/10 dark:border-white/10 bg-surface-white dark:bg-surface-charcoal p-2 shadow-lg"
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/5 dark:hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

