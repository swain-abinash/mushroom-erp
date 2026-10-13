// Role & permission catalogue — source of truth: doc/06_RBAC_AND_SECURITY_ARCHITECTURE.md §2–3.
// Seeded into the `roles`, `permissions` and `role_permissions` tables; runtime checks always read
// the database so that role edits take effect without a redeploy.

export const ROLES = {
  FOUNDER_ADMIN: "FOUNDER_ADMIN",
  FARM_MANAGER: "FARM_MANAGER",
  PRODUCTION_STAFF: "PRODUCTION_STAFF",
  INVENTORY_STAFF: "INVENTORY_STAFF",
  OPERATIONS_STAFF: "OPERATIONS_STAFF",
  CUSTOMER: "CUSTOMER",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

export const STAFF_ROLES: readonly RoleName[] = [
  ROLES.FOUNDER_ADMIN,
  ROLES.FARM_MANAGER,
  ROLES.PRODUCTION_STAFF,
  ROLES.INVENTORY_STAFF,
  ROLES.OPERATIONS_STAFF,
];

export function isStaff(roles: readonly string[]): boolean {
  return roles.some((role) => STAFF_ROLES.includes(role as RoleName));
}

export const ROLE_DEFINITIONS: Record<RoleName, { displayName: string; description: string }> = {
  FOUNDER_ADMIN: {
    displayName: "Co-Founder / Super Admin",
    description:
      "Unrestricted access: P&L, salaries, pricing overrides, role assignment, audit logs, settings.",
  },
  FARM_MANAGER: {
    displayName: "Operations Manager",
    description:
      "Full operations: production, harvest, inventory, purchases, orders and operational reports.",
  },
  PRODUCTION_STAFF: {
    displayName: "Agronomy & Cultivation Staff",
    description:
      "Farm floor only: batches, beds, room conditions, harvest weights, contamination loss.",
  },
  INVENTORY_STAFF: {
    displayName: "Warehouse & Stock Keeper",
    description:
      "Raw materials, packaging stock in/out, inventory transactions, wastage and spoilage.",
  },
  OPERATIONS_STAFF: {
    displayName: "Fulfillment & Dispatch Agent",
    description: "Order queue, packing, packing slips, delivery assignment, dispatch timestamps.",
  },
  CUSTOMER: {
    displayName: "Retail / B2B Customer",
    description:
      "Storefront and account: catalog, cart, orders, payments, order tracking, addresses.",
  },
};

export const PERMISSIONS = {
  USERS_VIEW: "users:view",
  USERS_MANAGE_ROLES: "users:manage_roles",
  CATALOG_PRODUCT_VIEW: "catalog:product:view",
  CATALOG_PRODUCT_MANAGE: "catalog:product:manage",
  CATALOG_PRICING_OVERRIDE: "catalog:pricing:override",
  ORDERS_CREATE_OWN: "orders:create_own",
  ORDERS_VIEW_ALL: "orders:view_all",
  ORDERS_UPDATE_STATUS: "orders:update_status",
  ORDERS_CANCEL_REFUND: "orders:cancel_refund",
  INVENTORY_VIEW_STOCK: "inventory:view_stock",
  INVENTORY_ADJUST_STOCK: "inventory:adjust_stock",
  INVENTORY_WRITE_OFF_SPOIL: "inventory:write_off_spoil",
  PRODUCTION_BATCH_CREATE: "production:batch:create",
  PRODUCTION_BATCH_UPDATE: "production:batch:update",
  PRODUCTION_BEDS_MANAGE: "production:beds:manage",
  HARVEST_LOG_ENTRY: "harvest:log_entry",
  HARVEST_QUALITY_GRADE: "harvest:quality_grade",
  SUPPLIERS_MANAGE: "suppliers:manage",
  PURCHASES_CREATE: "purchases:create",
  EXPENSES_RECORD: "expenses:record",
  EXPENSES_VIEW_ALL: "expenses:view_all",
  FINANCE_PNL_VIEW: "finance:pnl:view",
  FINANCE_TAX_EXPORT: "finance:tax_export",
  AUDIT_LOGS_INSPECT: "audit:logs:inspect",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_DESCRIPTIONS: Record<PermissionCode, string> = {
  "users:view": "View staff accounts and their roles",
  "users:manage_roles": "Invite staff, assign roles, deactivate accounts",
  "catalog:product:view": "View the product catalog",
  "catalog:product:manage": "Create and edit products and categories",
  "catalog:pricing:override": "Override product pricing",
  "orders:create_own": "Place orders for one's own account",
  "orders:view_all": "View all customer orders",
  "orders:update_status": "Advance order fulfilment status",
  "orders:cancel_refund": "Cancel and refund orders",
  "inventory:view_stock": "View stock balances",
  "inventory:adjust_stock": "Record stock in/out and manual adjustments",
  "inventory:write_off_spoil": "Write off spoiled or wasted stock",
  "production:batch:create": "Create production batches",
  "production:batch:update": "Update production batch progress",
  "production:beds:manage": "Manage growing beds",
  "harvest:log_entry": "Log harvest weights",
  "harvest:quality_grade": "Grade harvest quality",
  "suppliers:manage": "Manage suppliers",
  "purchases:create": "Record supplier purchases",
  "expenses:record": "Record business expenses",
  "expenses:view_all": "View all expenses",
  "finance:pnl:view": "View profit & loss",
  "finance:tax_export": "Export tax reports",
  "audit:logs:inspect": "Inspect the audit log",
};

const P = PERMISSIONS;

// Cells marked ✅ / Write / Full in the matrix grant the permission. "Read" cells are granted only
// for view-type codes; a read mark on a write-type code (e.g. INVENTORY_STAFF on harvest:log_entry)
// is not representable with a single atomic code and is left ungranted.
export const ROLE_PERMISSIONS: Record<RoleName, readonly PermissionCode[]> = {
  FOUNDER_ADMIN: Object.values(P),
  FARM_MANAGER: [
    P.USERS_VIEW,
    P.CATALOG_PRODUCT_VIEW,
    P.CATALOG_PRODUCT_MANAGE,
    P.ORDERS_VIEW_ALL,
    P.ORDERS_UPDATE_STATUS,
    P.ORDERS_CANCEL_REFUND,
    P.INVENTORY_VIEW_STOCK,
    P.INVENTORY_ADJUST_STOCK,
    P.INVENTORY_WRITE_OFF_SPOIL,
    P.PRODUCTION_BATCH_CREATE,
    P.PRODUCTION_BATCH_UPDATE,
    P.PRODUCTION_BEDS_MANAGE,
    P.HARVEST_LOG_ENTRY,
    P.HARVEST_QUALITY_GRADE,
    P.SUPPLIERS_MANAGE,
    P.PURCHASES_CREATE,
    P.EXPENSES_RECORD,
    P.EXPENSES_VIEW_ALL,
  ],
  PRODUCTION_STAFF: [
    P.CATALOG_PRODUCT_VIEW,
    P.INVENTORY_VIEW_STOCK,
    P.PRODUCTION_BATCH_CREATE,
    P.PRODUCTION_BATCH_UPDATE,
    P.PRODUCTION_BEDS_MANAGE,
    P.HARVEST_LOG_ENTRY,
    P.HARVEST_QUALITY_GRADE,
  ],
  INVENTORY_STAFF: [
    P.CATALOG_PRODUCT_VIEW,
    P.ORDERS_VIEW_ALL,
    P.INVENTORY_VIEW_STOCK,
    P.INVENTORY_ADJUST_STOCK,
    P.INVENTORY_WRITE_OFF_SPOIL,
    P.PURCHASES_CREATE,
  ],
  OPERATIONS_STAFF: [
    P.CATALOG_PRODUCT_VIEW,
    P.ORDERS_VIEW_ALL,
    P.ORDERS_UPDATE_STATUS,
    P.INVENTORY_VIEW_STOCK,
  ],
  CUSTOMER: [P.CATALOG_PRODUCT_VIEW, P.ORDERS_CREATE_OWN],
};

export function moduleOf(code: PermissionCode): string {
  return code.split(":")[0];
}
