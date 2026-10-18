import Link from "next/link";
import { getCurrentUser, hasPermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { signOutAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/** Sidebar links filtered by the signed-in user's permissions. Render inside a <Suspense> boundary. */
export async function AdminNav() {
  const user = await getCurrentUser();
  if (!user) return null;

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: "📊", visible: true },
    {
      href: "/admin/orders",
      label: "Orders & Delivery",
      icon: "📦",
      visible: hasPermission(user, PERMISSIONS.ORDERS_VIEW_ALL),
    },
    {
      href: "/admin/products",
      label: "Products",
      icon: "🍄",
      visible: hasPermission(user, PERMISSIONS.CATALOG_PRODUCT_VIEW),
    },
    {
      href: "/admin/categories",
      label: "Categories",
      icon: "🏷️",
      visible: hasPermission(user, PERMISSIONS.CATALOG_PRODUCT_MANAGE),
    },
    {
      href: "/admin/inventory",
      label: "Inventory & Stock",
      icon: "📋",
      visible: hasPermission(user, PERMISSIONS.INVENTORY_VIEW_STOCK),
    },
    {
      href: "/admin/production",
      label: "Cultivation & Batches",
      icon: "🌱",
      visible: user.isStaff,
    },
    {
      href: "/admin/purchases",
      label: "Purchases & Suppliers",
      icon: "🛒",
      visible: hasPermission(user, PERMISSIONS.PURCHASES_CREATE),
    },
    {
      href: "/admin/expenses",
      label: "Expense Ledger",
      icon: "💸",
      visible: hasPermission(user, PERMISSIONS.EXPENSES_RECORD),
    },
    {
      href: "/admin/reports/pnl",
      label: "Real-Time P&L",
      icon: "📈",
      visible: hasPermission(user, PERMISSIONS.FINANCE_PNL_VIEW),
    },
    {
      href: "/admin/employees",
      label: "Employees & Access",
      icon: "👥",
      visible: hasPermission(user, PERMISSIONS.USERS_VIEW),
    },
    {
      href: "/admin/settings",
      label: "Business Settings",
      icon: "⚙️",
      visible: user.isFounder,
    },
  ];

  return (
    <div className="flex flex-1 flex-col justify-between gap-6 font-body text-xs">
      <nav className="flex flex-col gap-1">
        {links
          .filter((link) => link.visible)
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-stone-700 dark:text-spore-ivory/80 hover:bg-forest-primary/10 dark:hover:bg-white/10 hover:text-forest-primary dark:hover:text-spore-ivory transition-colors font-medium"
            >
              <span className="text-sm shrink-0">{link.icon}</span>
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
      </nav>

      <div className="flex flex-col gap-3 border-t border-stone-200 dark:border-white/10 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-stone-500 dark:text-spore-ivory/50">
            Theme
          </span>
          <ThemeToggle compact />
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-100/80 dark:bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-forest-primary dark:text-spore-ivory hover:bg-stone-200/80 dark:hover:bg-white/10 transition-colors"
        >
          <span>🏪</span>
          <span>View Customer Shop</span>
        </Link>

        <div className="rounded-xl border border-stone-200/80 dark:border-white/10 bg-stone-50 dark:bg-white/5 p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-stone-900 dark:text-spore-ivory block truncate max-w-[130px]">
              {user.name}
            </span>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign out"
                className="text-[11px] text-alert-coral hover:underline font-semibold cursor-pointer"
              >
                Exit
              </button>
            </form>
          </div>
          <span className="inline-block rounded-md bg-forest-primary/10 dark:bg-success-mint/20 px-1.5 py-0.5 text-[9px] font-bold text-forest-primary dark:text-success-mint uppercase tracking-wider mt-1">
            {user.roles[0]?.replace(/_/g, " ") ?? "STAFF"}
          </span>
        </div>
      </div>
    </div>
  );
}
