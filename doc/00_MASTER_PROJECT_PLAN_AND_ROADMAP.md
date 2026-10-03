# 🍄 Mushroom Business Management & E-Commerce Platform (Mushroom ERP)
## Document 00: Master Project Plan, Sprint Roadmap & Operational Execution

**Project Name:** SporeERP (Mushroom Business Management & E-Commerce Platform)  
**Version:** 1.0.0-PROD-SPEC  
**Date:** October 2026  
**Target Audience:** 2 Co-Founders, Technical Lead, Farm Operations Manager, Software Engineers  
**Classification:** Internal Confidential / Master Engineering Blueprint  

---

## 1. Executive Summary & Project Planning Context

This document outlines the master engineering, operational, and delivery roadmap for building a unified, full-stack **Mushroom ERP and E-Commerce Platform**. Rather than developing and maintaining fragmented applications or relying on spreadsheets, WhatsApp messaging, and manual paper logs, this platform provides a single source of truth across the entire mushroom business lifecycle:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   END-TO-END MUSHROOM LIFECYCLE                                │
│                                                                                                 │
│  [Procurement] ──> [Spawn & Substrate] ──> [Cultivation Batches] ──> [Beds / Racks / Rooms]     │
│                                                                              │                  │
│  [Customer Delivery] <── [Order Packing] <── [Customer Order] <── [Inventory & Catalog] <───────┘
│          │                                                                                      │
│          ▼                                                                                      │
│  [Payments & Invoicing] ──> [Expense Recording] ──> [Real-Time P&L & Analytics Dashboard]       │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 The 2-Founder Lean Operating Model
The system is purposely tailored for a lean **2-founder setup** where operational agility and zero software overhead are critical:

| Founder | Primary Responsibilities | Core System Modules Used Daily |
| :--- | :--- | :--- |
| **Founder 1 (Tech, Finance & Growth)** | Software maintenance, e-commerce growth, customer acquisition, financial reporting, order fulfillment oversight, investor/P&L analytics. | Founder Dashboard, Orders, Finance & Expenses, Customer Management, B2B Accounts, Analytics & Reports. |
| **Founder 2 (Farm Operations & Supply)** | Farm cultivation, substrate preparation, spawn management, room environmental monitoring, harvest quality grading, raw material procurement. | Production Batches, Growing Rooms & Beds, Harvest Logger, Quality Control, Inventory, Suppliers & Purchases. |

---

## 2. Phased Development Strategy

To balance rapid time-to-market with operational stability, development is structured across **Three Clear Phases**:

```
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │ PHASE 1: LEAN MVP (Weeks 1 - 4)                                                  │
 │ Core e-commerce, customer portal, inventory ledger, batch tracking & admin hub  │
 └─────────────────────────┬────────────────────────────────────────────────────────┘
                           │
 ┌─────────────────────────▼────────────────────────────────────────────────────────┐
 │ PHASE 2: INTEGRATED OPERATIONS (Weeks 5 - 8)                                     │
 │ Harvest grading, bed rack visuals, purchases, expense ledger, delivery, P&L     │
 └─────────────────────────┬────────────────────────────────────────────────────────┘
                           │
 ┌─────────────────────────▼────────────────────────────────────────────────────────┐
 │ PHASE 3: ADVANCED SCALING & SAAS (Weeks 9 - 12+)                                 │
 │ B2B wholesale pricing, automated notifications, IoT climate logs, SaaS tenanting │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed 8-Sprint Development Roadmap

Each sprint is scoped for **1 week (5–6 working days)** with concrete deliverables, dependencies, and acceptance criteria.

```
Sprint 1 ──> Sprint 2 ──> Sprint 3 ──> Sprint 4 ──> Sprint 5 ──> Sprint 6 ──> Sprint 7 ──> Sprint 8
(Infra/DB)   (Auth/RBAC)  (Catalog/UI) (Cart/Orders)(Pay/Stock)  (Production) (ERP/Finance)(Deploy/GoLive)
```

---

### Sprint 1: Project Setup, Database Infrastructure & Core Scaffolding
* **Duration:** Days 1 – 7
* **Primary Objective:** Build a bulletproof development environment, configure MariaDB, set up Prisma ORM, and scaffold Next.js App Router architecture.

#### Key Deliverables:
1. Initialize Next.js 15+ project with TypeScript, ESLint, Prettier, and absolute path alias configuration (`@/*`).
2. Scaffold Docker Compose environment for local development:
   - MariaDB 11.x database container with persistent volume and UTF8MB4 charset.
   - Redis 7.x container for session caching and rate-limiting.
   - Adminer / phpMyAdmin for database inspection.
3. Configure Prisma ORM with MariaDB connection pool parameters (`connection_limit=10`, `pool_timeout=20`).
4. Implement unified directory layout:
   - `/app/(customer)/*` — Public and customer portal routes.
   - `/app/admin/*` — Business ERP routes with layout wrappers.
   - `/app/api/*` — Backend REST endpoints and Server Actions.
   - `/lib/*`, `/services/*`, `/repositories/*`, `/types/*` — Layered architecture.
5. Create base database migration scripts and verification seeds.

#### Acceptance Criteria:
- [x] `npm run dev` executes with zero warnings and hot reloading active.
- [x] MariaDB connection verified via Prisma CLI (`npx prisma db push` & `npx prisma studio`).
- [x] Baseline health check endpoint (`GET /api/health`) returns `200 OK` with database ping latency.

---

### Sprint 2: Authentication, User Profiles & Role-Based Access Control (RBAC)
* **Duration:** Days 8 – 14
* **Primary Objective:** Secure the platform with NextAuth.js / Auth.js, database sessions, JWT tokens, and fine-grained role permissions.

#### Key Deliverables:
1. Setup Auth.js (NextAuth v5) with Credentials Provider and MariaDB Adapter.
2. Implement schema models: `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `Customer`, `CustomerAddress`, `Employee`.
3. Seed default roles:
   - `FOUNDER_ADMIN` (Super Administrator — all permissions)
   - `FARM_MANAGER` (Full operations & operational reporting)
   - `PRODUCTION_STAFF` (Cultivation, batches, beds, harvest entry)
   - `INVENTORY_STAFF` (Stock in/out, packaging, raw materials)
   - `OPERATIONS_STAFF` (Order packing, dispatch, delivery assignment)
   - `CUSTOMER` (Catalog, cart, orders, profile, tickets)
4. Implement Next.js Edge Middleware for route protection:
   - Restrict `/admin/*` to internal staff roles with specific permission guards.
   - Restrict `/account/*` and `/checkout/*` to authenticated customers.
5. Build Customer Registration, Login, Forgot Password, and Profile pages.
6. Build Admin Employee Management module (invite staff, assign roles, deactivate accounts).

#### Acceptance Criteria:
- [x] Unauthorized users attempting to access `/admin/*` are redirected to `/login` with return URL.
- [x] Role permission changes take effect immediately without requiring code redeployment.
- [x] Passwords hashed with bcrypt (cost factor 12) and secure HTTP-only cookies enforced.

---

### Sprint 3: Category & Product Management + Customer E-Commerce Experience
* **Duration:** Days 15 – 21
* **Primary Objective:** Build the rich product catalog, category taxonomy, media uploads, and high-converting customer storefront.

#### Key Deliverables:
1. Implement Catalog schema: `Category`, `Product`, `ProductImage`, `ProductPricingTier`.
2. Admin Product Management UI:
   - CRUD interface for Fresh Mushrooms (Oyster, Milky, Paddy Straw), Processed (Dry, Powder), and Supplies (Spawn, Kits).
   - Rich form with multi-image upload, SKU generator, unit selectors (KG, Grams, Pack, Bottle), and minimum order quantity.
   - B2B price tier configuration (Retail, Restaurant, Wholesale).
3. Customer Storefront UI:
   - High-impact Hero section with value propositions (Fresh Harvest Guarantee, 100% Organic, Local Cultivation).
   - Filterable product catalog by category, mushroom variety, and availability status.
   - Product Details Page (PDP) with harvest freshness badge, nutritional benefits, storage tips, and dynamic quantity selector.
4. SEO optimizations: Metadata generation, OpenGraph tags, JSON-LD structured data for products.

#### Acceptance Criteria:
- [x] Admin can create products with images, description, pricing, and stock limits.
- [x] Customer storefront loads instantly with sub-second LCP (Largest Contentful Paint).
- [x] Out-of-stock products clearly indicated with back-order/notify-me toggle.

---

### Sprint 4: Shopping Cart, Multi-Step Checkout & Order State Machine
* **Duration:** Days 22 – 28
* **Primary Objective:** Build an interactive shopping cart, address selector, checkout funnel, and robust Order lifecycle state machine.

#### Key Deliverables:
1. Cart Management:
   - Persistent Server + LocalStorage cart state for guest and logged-in customers.
   - Slide-out cart drawer with real-time subtotal, delivery fee calculator, and free delivery thresholds.
2. Multi-Step Checkout Engine:
   - Step 1: Contact & Delivery Address (saved address picker + geolocation autocomplete).
   - Step 2: Delivery Slot selection (Morning Harvest Dispatch / Evening Dispatch).
   - Step 3: Payment Method Selection (Online UPI / Razorpay / Cash on Delivery).
   - Step 4: Order Review & Instant Inventory Stock Verification.
3. Order Management System (OMS):
   - Schema models: `Order`, `OrderItem`, `OrderStatusHistory`.
   - Order Status State Machine: `PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `PACKED` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED` (or `CANCELLED` / `REFUNDED`).
4. Admin Orders Dashboard:
   - Kanban board and tabular view of live orders.
   - Single-click status transitions with automatic timestamp logging.
   - Order packing slip and invoice PDF generator.

#### Acceptance Criteria:
- [x] Customer can complete checkout in under 3 steps with zero layout shifts.
- [x] Placing an order atomically generates `Order` + `OrderItems` + `OrderStatusHistory` in MariaDB.
- [x] Admin receives instant visual notification on incoming orders.

---

### Sprint 5: Payment Processing & Atomic Inventory Transaction Ledger
* **Duration:** Days 29 – 35
* **Primary Objective:** Integrate payment gateways and implement transactional, double-entry inventory tracking to prevent overselling.

#### Key Deliverables:
1. Payment Integration:
   - Razorpay / UPI payment gateway integration with Webhook signature verification.
   - Schema models: `Payment`, `Refund`.
   - Support for partial refunds, payment retry, and COD payment reconciliation.
2. Real-Time Inventory Transaction Engine:
   - Schema models: `InventoryItem`, `InventoryTransaction`.
   - Transaction types: `PURCHASE`, `PRODUCTION`, `HARVEST`, `SALE`, `WASTAGE`, `RETURN`, `ADJUSTMENT`.
3. Concurrency & Race Condition Prevention:
   - Implement MariaDB row-level locking (`SELECT ... FOR UPDATE`) during checkout stock reservation.
   - Atomic rollback if available stock is less than cart requested quantity.
4. Admin Inventory Management Center:
   - Stock overview with real-time indicators: In Stock, Low Stock Warning, Out of Stock.
   - Stock adjustment modal with mandatory reason logging (Spoilage, Sampling, Miscount).
   - Complete audit trail of every gram of mushroom moved.

#### Acceptance Criteria:
- [x] Concurrent checkout attempts on limited stock (e.g. 5kg remaining vs two 4kg orders) safely process one and gracefully notify the other.
- [x] Webhook securely updates payment status from `PENDING` to `SUCCESS` and triggers order confirmation.
- [x] Every stock change logs a corresponding `InventoryTransaction` record.

---

### Sprint 6: Mushroom Cultivation Batches, Bed Monitoring & Harvest Quality Control
* **Duration:** Days 36 – 42
* **Primary Objective:** Build the specialized Agronomy & Cultivation ERP modules that distinguish this system from generic e-commerce.

#### Key Deliverables:
1. Production Batch Management:
   - Schema models: `ProductionBatch`, `GrowingRoom`, `Rack`, `GrowingBed`, `BatchStatusHistory`.
   - Batch lifecycle: `PLANNED` ➔ `PREPARATION` ➔ `SPAWNING` ➔ `INCUBATION` ➔ `FRUITING` ➔ `HARVESTING` ➔ `COMPLETED` (or `CONTAMINATED`).
   - Tracking metrics: Mushroom Type, Spawn Supplier, Substrate Quantity (KG), Number of Beds, Expected Harvest Date, Target Yield.
2. Growing Room & Rack Matrix:
   - Interactive visual grid of growing rooms (e.g. Room A, Room B), Racks (Rack 1, 2, 3), and individual Beds (Bed 001..Bed 100).
   - Bed status toggles: Colonizing, Pinning, Ready to Harvest, Contaminated.
3. Harvest Management & Quality Grading:
   - Schema models: `Harvest`, `HarvestGrade`.
   - Harvest logger: Batch ID, Harvest Date, Total Yield (KG), Flush Number (Flush #1, Flush #2, Flush #3).
   - Quality Grading split: Grade A (Premium Whole), Grade B (Button/Small), Grade C (Processed/Dry candidate), Rejected/Wastage.
   - Automatic sync: Completed harvest auto-injects Grade A/B mushroom quantities into Finished Goods Inventory.

#### Acceptance Criteria:
- [x] Farm staff can log a harvest in under 30 seconds from a mobile or tablet browser.
- [x] Logging a harvest automatically increments inventory and records an `INVENTORY_TRANSACTION` of type `HARVEST`.
- [x] Biological Efficiency % and Contamination % calculated automatically per batch.

---

### Sprint 7: Procurement, Expense Management & Real-Time P&L Center
* **Duration:** Days 43 – 49
* **Primary Objective:** Deliver financial control, supplier management, raw material purchases, and real-time business profitability analytics.

#### Key Deliverables:
1. Supplier & Procurement Management:
   - Schema models: `Supplier`, `Purchase`, `PurchaseItem`.
   - Track suppliers for Paddy Straw, Spawn, Poly bags, Disinfectants, Equipment, Packaging.
   - Material receipt workflow: Receiving raw materials updates raw material inventory ledger.
2. Expense Accounting Module:
   - Schema models: `Expense`, `ExpenseCategory`.
   - Standard categories: Raw Materials, Electricity, Farm Labor/Salaries, Water, Rent, Delivery Fuel, Packaging, Marketing, Maintenance, Misc.
   - Quick receipt upload and payment method recording (UPI, Bank Transfer, Cash).
3. Executive Financial Command Center:
   - Real-time P&L Statement: `Gross Profit = Sales Revenue - Cost of Goods Sold (Spawn + Substrate + Packaging)`.
   - `Net Profit = Gross Profit - Operating Expenses (Rent + Electricity + Salaries + Delivery + Marketing)`.
   - Interactive date filters: Today, This Week, This Month, Fiscal Quarter, Custom Date Range.

#### Acceptance Criteria:
- [x] Founders can view instant Net Profit and Cost-per-KG metrics without manual Excel calculations.
- [x] Every purchase and expense ties back to a specific category and payment method.
- [x] Exportable financial summaries in CSV and PDF formats.

---

### Sprint 8: System Hardening, Audit Logs, Mobile Polish & Production Deployment
* **Duration:** Days 50 – 56
* **Primary Objective:** Execute comprehensive QA, security audits, database indexing, automated backups, and production VPS deployment.

#### Key Deliverables:
1. Audit Logging & Security Hardening:
   - Schema models: `AuditLog`, `BusinessSetting`, `Notification`.
   - Automatic capture of critical changes (Price edits, Stock write-offs, Role reassignments, Order cancellations).
   - Rate limiting on API routes and brute-force protection on authentication.
2. Mobile Responsiveness & PWA Optimization:
   - Mobile-first optimization for farm staff logging data on mobile devices in high-humidity grow rooms.
   - Offline-capable UI caching for farm floor operations.
3. Production DevOps Setup:
   - Production Docker Compose configuration with MariaDB 11, Next.js standalone server, Redis, and Nginx reverse proxy with automated Let's Encrypt SSL.
   - Automated daily MariaDB database backup script with rotation and off-site cloud storage.
   - System health monitoring and error logging (Sentry / Pino).

#### Acceptance Criteria:
- [x] End-to-end tests verify complete order lifecycle from customer checkout to farm harvest and P&L calculation.
- [x] Lighthouse performance, accessibility, and SEO scores exceed 90+.
- [x] Automated database backup successfully executes and verifies data integrity.

---

## 4. Resource Allocation & Responsibility Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            FOUNDER RESPONSIBILITY MATRIX                         │
├────────────────────────────────────────┬─────────────────────────────────────────┤
│ FOUNDER 1 (Tech, Growth & Finance)     │ FOUNDER 2 (Agronomy & Supply Chain)     │
├────────────────────────────────────────┼─────────────────────────────────────────┤
│ • Next.js full-stack development       │ • Agronomy parameters & batch workflows │
│ • Database schema & API design         │ • Supplier sourcing & raw material specs│
│ • Razorpay / Payment integration       │ • Harvest quality criteria & grading    │
│ • Customer portal UX & SEO             │ • Farm layout (Rooms, Racks, Beds) data │
│ • Finance, Tax, Invoicing & P&L setup  │ • Farm staff training & data entry QA   │
│ • Production server & DevOps deployment│ • Packaging & delivery partner setup    │
└────────────────────────────────────────┴─────────────────────────────────────────┘
```

---

## 5. Risk Assessment & Mitigation Framework

| Risk Description | Severity | Likelihood | Concrete Mitigation Plan |
| :--- | :---: | :---: | :--- |
| **Fresh Mushroom Perishability (Short 24-48h Shelf Life)** | HIGH | HIGH | System enforces **FIFO (First In, First Out)** inventory rules; generates automated flash-sale discounts or alerts to convert fresh stock into dehydrated/powdered mushrooms before spoilage. |
| **Crop Contamination (Trichoderma / Mold Outbreaks)** | HIGH | MEDIUM | Production module tracks room and bed contamination rates; flags suspicious spawn suppliers or substrate sterilization batches for immediate quarantine. |
| **Inventory Stock Race Conditions During High Demand** | HIGH | LOW | Strict MariaDB database transactions with row-level locks (`FOR UPDATE`) prevent double-booking or overselling available stock. |
| **Farm Staff Resistance to Digital Logging** | MEDIUM | MEDIUM | Mobile-optimized large-button UI with minimal text fields (numerical steppers and dropdowns) allowing 15-second data entry on smartphones. |
| **Data Loss or Server Hardware Failure** | CRITICAL | LOW | Automated cron-driven hourly WAL logs, daily encrypted MariaDB dumps synced to Amazon S3 / Google Cloud Storage, and Infrastructure-as-Code via Docker. |

---

## 6. Definition of Done (DoD) & Acceptance Sign-Off

For any feature or module to be marked complete and ready for production operations:
1. **Code Quality:** Written in strict TypeScript with zero `any` types; passes ESLint and Prettier without warnings.
2. **Database Integrity:** Foreign key constraints, cascade rules, and indexes applied; all database operations wrapped in Prisma transactions where multi-table mutations occur.
3. **Security:** Authorization middleware verified; role-based access checks validated at both API and UI component levels; input validated with Zod schemas.
4. **Audit Trail:** Any state-altering action logs an entry in `AuditLog` with actor ID, timestamp, previous value, and updated value.
5. **Mobile Readiness:** Responsive layout verified on 375px (mobile), 768px (tablet), and 1440px (desktop) viewports.
6. **Founder Sign-Off:** Tested and approved by both Founder 1 (system validation) and Founder 2 (operational flow validation).
