"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type PaletteItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  category: "Actions" | "Navigation" | "Theme";
  action: () => void;
  keywords?: string[];
};

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Toggle dark/light theme
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("sporeerp_theme", "light");
      } catch {}
    } else {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("sporeerp_theme", "dark");
      } catch {}
    }
    window.dispatchEvent(
      new CustomEvent("sporeerp_theme_changed", { detail: isDark ? "light" : "dark" }),
    );
  };

  const items: PaletteItem[] = [
    // Actions
    {
      id: "act-harvest",
      title: "Log Morning Harvest",
      subtitle: "Record fresh flushes picked from growing beds",
      icon: "🍄",
      category: "Actions",
      action: () => router.push("/admin/production/harvests"),
      keywords: ["harvest", "flush", "log", "production", "pick", "morning"],
    },
    {
      id: "act-new-product",
      title: "Add New Product Variety",
      subtitle: "Create a new mushroom variety in storefront catalog",
      icon: "✨",
      category: "Actions",
      action: () => router.push("/admin/products/new"),
      keywords: ["product", "new", "create", "variety", "catalog", "oyster"],
    },
    {
      id: "act-spawn-batch",
      title: "Spawn Cultivation Batch",
      subtitle: "Start a new batch and assign to growing bed",
      icon: "🌱",
      category: "Actions",
      action: () => router.push("/admin/production/batches"),
      keywords: ["batch", "spawn", "grow", "cultivation", "bed", "inoculation"],
    },
    {
      id: "act-expense",
      title: "Record Farm Expense",
      subtitle: "Log electricity, packaging, labor, or spawn cost",
      icon: "💸",
      category: "Actions",
      action: () => router.push("/admin/expenses"),
      keywords: ["expense", "cost", "opex", "money", "record", "bill"],
    },
    {
      id: "act-purchase",
      title: "New Raw Material PO",
      subtitle: "Order grain spawn, bags, or straw from suppliers",
      icon: "🛒",
      category: "Actions",
      action: () => router.push("/admin/purchases"),
      keywords: ["purchase", "po", "supplier", "material", "order", "raw"],
    },
    {
      id: "act-theme",
      title: "Toggle Light / Dark Mode",
      subtitle: "Switch between Obsidian dark and Titanium light theme",
      icon: "🌓",
      category: "Theme",
      action: toggleTheme,
      keywords: ["theme", "dark", "light", "mode", "color", "switch"],
    },

    // Navigation
    {
      id: "nav-dash",
      title: "Command Center Dashboard",
      subtitle: "Executive overview & live telemetry",
      icon: "📊",
      category: "Navigation",
      action: () => router.push("/admin/dashboard"),
      keywords: ["dashboard", "home", "admin", "telemetry", "metrics"],
    },
    {
      id: "nav-orders",
      title: "Orders & Delivery Queue",
      subtitle: "Fulfill morning & evening harvest customer dispatches",
      icon: "📦",
      category: "Navigation",
      action: () => router.push("/admin/orders"),
      keywords: ["orders", "delivery", "dispatch", "fulfill", "customer"],
    },
    {
      id: "nav-inventory",
      title: "Inventory & Stock Levels",
      subtitle: "Check available vs reserved stock across categories",
      icon: "📋",
      category: "Navigation",
      action: () => router.push("/admin/inventory"),
      keywords: ["inventory", "stock", "kg", "reserved", "available", "audit"],
    },
    {
      id: "nav-rooms",
      title: "Growing Rooms & Bed Matrix",
      subtitle: "Inspect fruiting rooms, temperature & humidity",
      icon: "🌡️",
      category: "Navigation",
      action: () => router.push("/admin/production/rooms"),
      keywords: ["rooms", "beds", "matrix", "temperature", "humidity", "climate"],
    },
    {
      id: "nav-pnl",
      title: "Real-Time Profit & Loss (P&L)",
      subtitle: "Unit economics, margins, COGS, and revenue",
      icon: "📈",
      category: "Navigation",
      action: () => router.push("/admin/reports/pnl"),
      keywords: ["pnl", "profit", "loss", "finance", "margin", "revenue"],
    },
    {
      id: "nav-employees",
      title: "Employees & Access Control",
      subtitle: "Manage staff, RBAC roles, and farm permissions",
      icon: "👥",
      category: "Navigation",
      action: () => router.push("/admin/employees"),
      keywords: ["employees", "staff", "rbac", "roles", "permissions", "access"],
    },
    {
      id: "nav-settings",
      title: "Business Settings & Delivery Slots",
      subtitle: "Configure store info, thresholds, and operational rules",
      icon: "⚙️",
      category: "Navigation",
      action: () => router.push("/admin/settings"),
      keywords: ["settings", "business", "config", "store", "rules"],
    },
    {
      id: "nav-shop",
      title: "Customer Storefront",
      subtitle: "View the live public shop and catalog",
      icon: "🏪",
      category: "Navigation",
      action: () => router.push("/products"),
      keywords: ["storefront", "shop", "customer", "products", "public"],
    },
  ];

  // Filter items based on user query
  const filteredItems = items.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(q);
    const subtitleMatch = item.subtitle?.toLowerCase().includes(q) ?? false;
    const keywordMatch = item.keywords?.some((k) => k.toLowerCase().includes(q)) ?? false;
    return titleMatch || subtitleMatch || keywordMatch;
  });

  // Global Ctrl+K / Cmd+K and Esc listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    }

    function handleCustomOpen() {
      setIsOpen(true);
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open_command_palette", handleCustomOpen);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open_command_palette", handleCustomOpen);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation inside the palette
  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter" && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].action();
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-3xl border border-stone-200/80 dark:border-white/15 bg-white dark:bg-[#121a17] shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyNavigation}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-stone-200/80 dark:border-white/10 px-4 py-3.5">
          <span className="text-lg text-stone-400 dark:text-spore-ivory/40 mr-3">🔍</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page, or search actions..."
            className="w-full bg-transparent text-sm font-medium text-stone-900 dark:text-spore-ivory placeholder-stone-400 dark:placeholder-spore-ivory/40 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-spore-ivory mr-2 cursor-pointer"
            >
              Clear
            </button>
          ) : null}
          <kbd className="hidden sm:inline-flex items-center rounded-md border border-stone-200 dark:border-white/15 bg-stone-100 dark:bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:text-spore-ivory/50">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 dark:text-spore-ivory/40">
              No matching commands or actions found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-forest-primary/10 dark:bg-emerald-500/15 text-forest-primary dark:text-success-mint"
                      : "text-stone-700 dark:text-spore-ivory/80 hover:bg-stone-100 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-stone-100 dark:bg-white/10 text-base">
                      {item.icon}
                    </span>
                    <div className="truncate">
                      <p
                        className={`text-xs font-bold truncate ${
                          isSelected
                            ? "text-stone-900 dark:text-white"
                            : "text-stone-800 dark:text-spore-ivory"
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.subtitle && (
                        <p className="text-[11px] text-stone-400 dark:text-spore-ivory/50 truncate">
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      item.category === "Actions"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : item.category === "Theme"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between border-t border-stone-200/80 dark:border-white/10 px-4 py-2 text-[10px] text-stone-400 dark:text-spore-ivory/40 bg-stone-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-semibold text-stone-600 dark:text-spore-ivory/70">↑↓</kbd> to
              navigate
            </span>
            <span>
              <kbd className="font-semibold text-stone-600 dark:text-spore-ivory/70">↵</kbd> to
              select
            </span>
          </div>
          <span>SporeERP Quick Command</span>
        </div>
      </div>
    </div>
  );
}

/** Small trigger pill to place on headers/toolbars */
export function CommandPaletteTrigger({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("open_command_palette"))}
      title="Open Command Palette (Ctrl+K)"
      aria-label="Open Command Palette"
      className={`group flex h-9 items-center gap-2 rounded-full border border-forest-primary/15 dark:border-white/15 bg-white/70 dark:bg-white/5 px-3 text-xs font-semibold text-stone-600 dark:text-spore-ivory/70 shadow-xs backdrop-blur-md hover:border-forest-primary/30 dark:hover:border-success-mint/40 hover:bg-white dark:hover:bg-white/10 hover:text-stone-900 dark:hover:text-spore-ivory transition-all active:scale-95 cursor-pointer ${className}`}
    >
      <span className="text-xs">🔍</span>
      <span className="hidden md:inline">Quick Search</span>
      <kbd className="hidden sm:inline-flex rounded bg-stone-200/70 dark:bg-white/10 px-1.5 py-0.5 text-[9px] font-bold font-data text-stone-500 dark:text-spore-ivory/60 group-hover:text-stone-700 dark:group-hover:text-spore-ivory">
        ⌘K
      </kbd>
    </button>
  );
}
