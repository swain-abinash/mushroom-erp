import Link from "next/link";
import { getCurrentUser, hasPermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { signOutAction } from "@/app/actions/auth";

/** Sidebar links filtered by the signed-in user's permissions. Render inside a <Suspense> boundary. */
export async function AdminNav() {
  const user = await getCurrentUser();
  if (!user) return null;

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", visible: true },
    {
      href: "/admin/orders",
      label: "Orders & Delivery",
      visible: hasPermission(user, PERMISSIONS.ORDERS_VIEW_ALL),
    },
    {
      href: "/admin/products",
      label: "Products",
      visible: hasPermission(user, PERMISSIONS.CATALOG_PRODUCT_VIEW),
    },
    {
      href: "/admin/categories",
      label: "Categories",
      visible: hasPermission(user, PERMISSIONS.CATALOG_PRODUCT_MANAGE),
    },
    {
      href: "/admin/inventory",
      label: "Inventory & Stock",
      visible: hasPermission(user, PERMISSIONS.INVENTORY_VIEW_STOCK),
    },
    {
      href: "/admin/production",
      label: "Cultivation & Batches",
      visible: user.isStaff,
    },
    {
      href: "/admin/purchases",
      label: "Purchases & Suppliers",
      visible: hasPermission(user, PERMISSIONS.PURCHASES_CREATE),
    },
    {
      href: "/admin/expenses",
      label: "Expense Ledger",
      visible: hasPermission(user, PERMISSIONS.EXPENSES_RECORD),
    },
    {
      href: "/admin/reports/pnl",
      label: "Real-Time P&L",
      visible: hasPermission(user, PERMISSIONS.FINANCE_PNL_VIEW),
    },
    {
      href: "/admin/employees",
      label: "Employees",
      visible: hasPermission(user, PERMISSIONS.USERS_VIEW),
    },
    {
      href: "/admin/settings",
      label: "Business Settings",
      visible: user.isFounder,
    },
  ];

  return (
    <div className="flex flex-1 flex-col justify-between gap-8 font-body text-sm">
      <nav className="flex flex-col gap-1">
        {links
          .filter((link) => link.visible)
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 hover:bg-surface-charcoal"
            >
              {link.label}
            </Link>
          ))}
      </nav>
      <div className="flex flex-col gap-2 border-t border-spore-ivory/10 pt-4">
        <Link href="/account" className="font-semibold hover:underline">
          {user.name}
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="text-spore-ivory/60 hover:text-spore-ivory">
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
