"use client";

import { useEffect, useState } from "react";

export function ThemeToggle({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const observer = new MutationObserver(() => {
      const currentDark = document.documentElement.classList.contains("dark");
      setTheme(currentDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("sporeerp_theme", "dark");
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("sporeerp_theme", "light");
      } catch {}
    }
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent("sporeerp_theme_changed", { detail: nextTheme }));
  };

  if (!mounted) {
    return (
      <div
        className={`h-9 w-9 rounded-full border border-forest-primary/10 dark:border-white/10 bg-white/40 dark:bg-white/5 opacity-50 ${className}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle theme"
      className={`group relative flex h-9 items-center justify-center rounded-full border border-forest-primary/15 dark:border-white/15 bg-white/70 dark:bg-surface-charcoal/90 px-2.5 text-xs font-semibold text-forest-primary dark:text-spore-ivory shadow-xs backdrop-blur-md transition-all hover:border-forest-primary/30 dark:hover:border-success-mint/40 hover:bg-white dark:hover:bg-surface-charcoal active:scale-95 cursor-pointer ${
        compact ? "w-9 px-0" : "gap-1.5"
      } ${className}`}
    >
      {theme === "dark" ? (
        <>
          <span className="text-warning-amber transition-transform duration-300 group-hover:rotate-45 text-sm">
            ☀️
          </span>
          {!compact && (
            <span className="hidden sm:inline text-[11px] font-medium text-spore-ivory/80">
              Light
            </span>
          )}
        </>
      ) : (
        <>
          <span className="text-indigo-600 dark:text-indigo-400 transition-transform duration-300 group-hover:-rotate-12 text-sm">
            🌙
          </span>
          {!compact && (
            <span className="hidden sm:inline text-[11px] font-medium text-forest-primary/80">
              Dark
            </span>
          )}
        </>
      )}
    </button>
  );
}
