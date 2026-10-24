import type { ReactNode } from "react";

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-md px-6 py-16">
      <div className="rounded-2xl border border-forest-primary/10 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal p-8 text-forest-primary dark:text-spore-ivory shadow-sm">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        {subtitle ? (
          <p className="mt-1 font-body text-sm text-forest-primary/70 dark:text-spore-ivory/70">{subtitle}</p>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
