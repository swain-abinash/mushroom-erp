# 🍄 Mushroom Business Management & E-Commerce Platform (Mushroom ERP)
## Document 02: Full-Stack System Architecture & Technical Specification

**Project Name:** SporeERP  
**Document Code:** DOC-02-ARCH  
**Version:** 1.0.0-PROD  
**Target Stack:** Next.js 15+ (App Router) • TypeScript • MariaDB 11.x • Prisma ORM • NextAuth.js v5 • Redis  

---

## 1. High-Level Architecture Overview

SporeERP employs a **Modern Monolithic Full-Stack Architecture** running within Next.js. This approach maximizes development velocity for a 2-founder team, minimizes DevOps maintenance overhead, and ensures strict type-safety across frontend components, API endpoints, business domain services, and database queries.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     SPORE ERP SYSTEM TOPOLOGY                                    │
│                                                                                                  │
│  [ CLIENT LAYER ]                                                                                │
│  ┌───────────────────────────────┐                  ┌─────────────────────────────────────────┐  │
│  │   Customer Portal (D2C/B2B)   │                  │     Business Admin ERP (Web / Mobile)   │  │
│  │   • React Server Components   │                  │     • Farm Cultivation Console          │  │
│  │   • Client Interactive Cart   │                  │     • Inventory & Harvest Logger        │  │
│  │   • Live Tracking & Checkout  │                  │     • Financial P&L & Order Pipeline    │  │
│  └───────────────┬───────────────┘                  └────────────────────┬────────────────────┘  │
│                  │                                                       │                       │
│  ────────────────┼───────────────────────────────────────────────────────┼─────────────────────  │
│  [ NEXT.JS APP ROUTER RUNTIME (Node.js 22 LTS) ]                         │                       │
│                  │                                                       │                       │
│                  ▼                                                       ▼                       │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                             EDGE MIDDLEWARE & SECURITY GUARDS                              │  │
│  │               • Session Validation (NextAuth.js)  • RBAC Permission Matrix                 │  │
│  │               • CSRF Token Protection            • Rate Limiting (Redis)                  │  │
│  └─────────────────────────────────────────────┬──────────────────────────────────────────────┘  │
│                                                │                                                 │
│                                                ▼                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              API ROUTE HANDLERS & SERVER ACTIONS                           │  │
│  │                                  (Zod Request Validation)                                  │  │
│  └─────────────────────────────────────────────┬──────────────────────────────────────────────┘  │
│                                                │                                                 │
│                                                ▼                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              DOMAIN SERVICES LAYER (Business Logic)                        │  │
│  │   • OrderService     • InventoryService    • ProductionService    • HarvestService         │  │
│  │   • PaymentService   • FinanceService      • NotificationService  • AuditService           │  │
│  └─────────────────────────────────────────────┬──────────────────────────────────────────────┘  │
│                                                │                                                 │
│                                                ▼                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                            DATA ACCESS LAYER (Prisma ORM Client)                           │  │
│  │                   • ACID Transactions (`$transaction`)  • Prepared SQL Queries             │  │
│  │                   • Connection Pooling (HikariCP equivalent via MariaDB engine)            │  │
│  └─────────────────────────────────────────────┬──────────────────────────────────────────────┘  │
│                                                │                                                 │
│  ──────────────────────────────────────────────┼───────────────────────────────────────────────  │
│  [ PERSISTENCE LAYER ]                         │                                                 │
│                                                ▼                                                 │
│  ┌────────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              MariaDB 11.x Relational Database                              │  │
│  │                   • InnoDB Engine  • UTF8MB4 Charset  • Strict SQL Mode                    │  │
│  │                   • Row-Level Locking (`FOR UPDATE`)  • Foreign Key Cascades               │  │
│  └────────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & Modular Layout

The codebase strictly separates presentation, domain logic, data access, and utilities:

```
mushroom-app/
├── app/
│   ├── (customer)/                      # Customer Storefront Route Group
│   │   ├── layout.tsx                   # Storefront Navbar, Footer & Cart Drawer
│   │   ├── page.tsx                     # Landing Page (Hero, Value Props, Featured)
│   │   ├── products/
│   │   │   ├── page.tsx                 # Filterable Product Catalog
│   │   │   └── [slug]/page.tsx          # Product Detail Page (PDP)
│   │   ├── cart/page.tsx                # Shopping Cart View
│   │   ├── checkout/page.tsx            # Multi-Step Checkout Funnel
│   │   ├── orders/
│   │   │   ├── page.tsx                 # Customer Order History
│   │   │   └── [id]/page.tsx            # Live Order Tracking & Invoice
│   │   ├── account/page.tsx             # Profile, Saved Addresses & Preferences
│   │   └── support/page.tsx             # Help Center & FAQ
│   │
│   ├── admin/                           # Business ERP Route Group (RBAC Protected)
│   │   ├── layout.tsx                   # Admin Sidebar, Header, Breadcrumbs & Notifications
│   │   ├── dashboard/page.tsx           # Executive Command Center (KPIs, Charts, Alerts)
│   │   ├── orders/
│   │   │   ├── page.tsx                 # Orders Kanban & Fulfillment Center
│   │   │   └── [id]/page.tsx            # Order Inspection & Status Transition
│   │   ├── products/
│   │   │   ├── page.tsx                 # Product Catalog Admin & Price Tiers
│   │   │   └── new/page.tsx             # Product Creator Form
│   │   ├── inventory/
│   │   │   ├── page.tsx                 # Stock Ledger & Raw Material Balances
│   │   │   └── transactions/page.tsx    # Double-Entry Stock Movement History
│   │   ├── production/
│   │   │   ├── page.tsx                 # Cultivation Batches Pipeline
│   │   │   └── [id]/page.tsx            # Batch Details, Inoculation & Timeline
│   │   ├── rooms/page.tsx               # Growing Rooms, Racks & Bed Visualizer
│   │   ├── harvest/
│   │   │   ├── page.tsx                 # Harvest Registry & Biological Efficiency
│   │   │   └── new/page.tsx             # Fast Mobile Harvest Logging Modal
│   │   ├── suppliers/page.tsx           # Supplier Directory & Material Catalogs
│   │   ├── purchases/page.tsx           # Raw Material Purchase Orders
│   │   ├── expenses/page.tsx            # Business Expenses & Receipt Uploads
│   │   ├── delivery/page.tsx            # Fleet Dispatch & Route Planning
│   │   ├── employees/page.tsx           # Team Roster, Shifts & Role Assignment
│   │   ├── reports/page.tsx             # P&L Statements, Sales & Agronomy Reports
│   │   └── settings/page.tsx            # Business Profile, Tax & Notification Config
│   │
│   ├── api/                             # REST API Route Handlers
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth.js Authentication Handler
│   │   ├── v1/
│   │   │   ├── products/route.ts        # Product Catalog API
│   │   │   ├── orders/route.ts          # Order Creation & Ingestion API
│   │   │   ├── inventory/route.ts       # Stock Reservation & Adjustment API
│   │   │   ├── production/route.ts      # Batch State Updates API
│   │   │   ├── harvest/route.ts         # Harvest Logging & Stock Injection API
│   │   │   ├── payments/
│   │   │   │   ├── razorpay/route.ts    # Razorpay Order Creation
│   │   │   │   └── webhook/route.ts     # Razorpay Webhook Verifier
│   │   │   ├── expenses/route.ts        # Expense Registry API
│   │   │   └── reports/pnl/route.ts     # Real-Time P&L Engine API
│   │   └── health/route.ts              # System Health & DB Ping Check
│   │
│   ├── global.css                       # Global Styles & Theme Variables
│   └── layout.tsx                       # Root HTML Layout & Font Providers
│
├── components/
│   ├── ui/                              # Reusable UI Atoms (Buttons, Badges, Inputs, Modals)
│   ├── customer/                        # Storefront Components (ProductCard, CartDrawer)
│   └── admin/                           # ERP Components (BedGrid, PnLCard, BatchKanban)
│
├── lib/
│   ├── db.ts                            # Global PrismaClient Singleton with Pool Controls
│   ├── auth.ts                          # NextAuth.js Config & Session Helpers
│   ├── permissions.ts                   # RBAC Matrix & Permission Guard Functions
│   ├── razorpay.ts                      # Payment Gateway SDK Client
│   └── utils.ts                         # Currency (₹), Date & String Formatters
│
├── services/                            # Pure Domain Business Logic Services
│   ├── order.service.ts                 # Order Validation, Inventory Lock & Checkout
│   ├── inventory.service.ts             # Atomic Stock Ledger & Concurrency Controls
│   ├── production.service.ts            # Batch Lifecycles & Biological Efficiency
│   ├── harvest.service.ts               # Harvest Grading & Inventory Synchronization
│   ├── finance.service.ts               # Expense Ledger & Real-Time P&L Calculations
│   ├── audit.service.ts                 # Immutable Activity & State Change Logging
│   └── notification.service.ts          # In-App Alerts, Email & SMS Dispatchers
│
├── types/                               # TypeScript Interfaces & Zod Validation Schemas
│   ├── api.types.ts
│   ├── order.types.ts
│   ├── production.types.ts
│   └── rbac.types.ts
│
├── prisma/
│   ├── schema.prisma                    # Complete MariaDB Relational Data Model
│   ├── migrations/                      # Version-controlled SQL migrations
│   └── seed.ts                          # Seed Data (Default Roles, Admin User, Products)
│
├── docker-compose.yml                   # Production & Staging Orchestration
└── Dockerfile                           # Multi-Stage Production Build
```

---

## 3. Layered Service Architecture Pattern

To prevent architectural degradation, business rules are never placed directly inside React components or API routes. Every transaction flows through a strict **4-Tier Pipeline**:

```
 [1. PRESENTATION TIER]     React Server Component / Client Form
            │               • Gathers input, executes client-side Zod validation.
            ▼
 [2. CONTROLLER TIER]       API Route Handler (`/api/v1/*`) or Server Action
            │               • Validates session token & RBAC permissions.
            │               • Parses & sanitizes request body with Zod schema.
            ▼
 [3. DOMAIN SERVICE TIER]   Pure Domain Service (`OrderService`, `HarvestService`)
            │               • Enforces business logic (e.g. stock availability check).
            │               • Orchestrates cross-domain events (e.g. Harvest ➔ Stock Injection).
            ▼
 [4. DATA ACCESS TIER]      Prisma ORM with MariaDB Transaction Scope
                            • Opens atomic MariaDB transaction (`BEGIN ... COMMIT`).
                            • Executes row-level locked queries (`SELECT ... FOR UPDATE`).
                            • Guarantees ACID compliance or performs rollback on error.
```

---

## 4. Transactional Concurrency Control & Stock Safety

Mushrooms are highly perishable and sold across multiple channels simultaneously. To eliminate race conditions and double-booking, stock reservation utilizes **Atomic MariaDB Transactions with Pessimistic Locking**:

```
CUSTOMER A (Orders 4kg)                      DATABASE                        CUSTOMER B (Orders 3kg)
Available Stock: 5kg                                                        Available Stock: 5kg
       │                                                                            │
       ├─── 1. BEGIN TRANSACTION ──────────────────┐                               │
       │                                           │                                │
       ├─── 2. SELECT stock FROM inventory ───────►│ (Row Locked by Customer A)     │
       │       WHERE product_id = 'P1'             │                                │
       │       FOR UPDATE;                         │◄── 3. SELECT stock ... ────────┤ (Customer B WAITS)
       │                                           │       FOR UPDATE;              │
       ├─── 4. Check: 5kg >= 4kg (SUCCESS)         │                                │
       ├─── 5. UPDATE inventory SET stock = 1kg    │                                │
       ├─── 6. INSERT order & order_items          │                                │
       ├─── 7. INSERT inventory_transaction (SALE) │                                │
       │                                           │                                │
       └─── 8. COMMIT TRANSACTION ────────────────►│ (Lock Released)                │
                                                   │                                │
                                                   │─── 9. Customer B Query Resumes ┤
                                                   │       Available Stock is now 1kg│
                                                   │                                │
                                                   │◄── 10. Check: 1kg < 3kg ───────┤
                                                   │        (INSUFFICIENT STOCK)    │
                                                   │                                │
                                                   │─── 11. ROLLBACK & Return Error ┴─> "Sorry, only 1kg remaining!"
```

---

## 5. Security & RBAC Middleware Architecture

Every incoming request to the application passes through Next.js Edge Middleware before executing any route handler:

```
 Incoming Request ──► [Edge Middleware] ──► Is Public Route? (e.g. `/`, `/products`, `/login`)
                             │                     │
                             │ (YES)               │ (NO)
                             ▼                     ▼
                     Allow Immediate Pass   Is User Authenticated? (NextAuth Session)
                                                   │
                                            ┌──────┴──────┐
                                            │             │
                                         (NO)             │ (YES)
                                          ▼               ▼
                                 Redirect to `/login`   Has Required Module Permission?
                                                               │
                                                        ┌──────┴──────┐
                                                        │             │
                                                     (NO)             │ (YES)
                                                      ▼               ▼
                                              Return `403 Forbidden`  Allow Access to Route
```

---

## 6. Performance, Caching & Scalability Controls

1. **Incremental Static Regeneration (ISR):** Public catalog pages (`/products`, `/products/[slug]`) are statically generated and revalidated every **60 seconds**, guaranteeing sub-50ms page loads.
2. **On-Demand Cache Tag Revalidation:** When an admin modifies product prices or stock status, Next.js `revalidateTag('product-catalog')` instantly purges stale cache globally.
3. **Database Connection Pooling:** Managed via Prisma connection pool configuration optimized for MariaDB:
   - `connection_limit = 15` (Max simultaneous active connections per container).
   - `pool_timeout = 20` (Seconds before timing out a waiting query).
4. **Redis Integration:** Used for NextAuth session caching, rate-limiting checkout attempts (max 5 requests/minute per IP), and pub/sub real-time dashboard notifications.
