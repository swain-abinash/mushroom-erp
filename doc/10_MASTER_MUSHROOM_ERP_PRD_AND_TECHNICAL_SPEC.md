# 🍄 Mushroom Business Management & E-Commerce Platform (SporeERP)
## Document 10: Master Product Requirements Document & Complete Technical Specification

**Project Title:** SporeERP (Mushroom Business Management & E-Commerce Platform)  
**Document Version:** 1.0.0-FINAL-ENTERPRISE  
**Release Date:** October 2026  
**Technology Stack:** Next.js 15+ (App Router) • TypeScript • MariaDB 11.x • Prisma ORM • NextAuth.js v5 • Redis • TailwindCSS  
**Author & Governance:** 2-Founder Executive Board & Lead Engineering Architect  

---

## 1. Executive Summary & Product Architecture

SporeERP is an enterprise-grade, full-stack application designed specifically to power the end-to-end commercial operations of a high-yield mushroom farming and retail business. The system integrates the entire commercial value chain into a single application:

```
                          SPORE ERP UNIFIED PLATFORM
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
        │                                                           │
 [CUSTOMER STOREFRONT]                                      [BUSINESS ERP HUB]
  • Fresh Harvest Catalog                                    • Executive P&L Dashboard
  • Real-Time Available Stock                                • Cultivation Batches & Beds
  • Cart & Multi-Step Checkout                               • Harvest Logger & Grading
  • Instant Razorpay / UPI                                   • Double-Entry Stock Ledger
  • Live Delivery Tracking                                   • Procurement & Expenses
  • B2B Wholesale Portal                                     • Granular Role-Based Access
        │                                                           │
        └─────────────────────────────┬─────────────────────────────┘
                                      │
                      [NEXT.JS 15 APP ROUTER LAYER]
                      (Server Components + API Routes)
                                      │
                         [PRISMA ORM & TRANSACTIONS]
                                      │
                       [MariaDB 11.x InnoDB DATABASE]
```

---

## 2. Comprehensive 14-Module Functional Specification

| Module Code | Module Title | Primary Capabilities & Workflows |
| :--- | :--- | :--- |
| **MOD-01** | **Authentication & RBAC** | Multi-role authentication (NextAuth v5), signed JWT sessions, bcrypt hashing, 40+ atomic permissions across 6 user roles, immutable security audit trail. |
| **MOD-02** | **Customer & B2B Profiles** | Customer self-registration, multi-address book with geo-coordinates, B2B restaurant business profiles with GSTIN and credit limits. |
| **MOD-03** | **Product Catalog & Taxonomy** | Hierarchical categories, multi-image product showcases, unit selector (KG, 500g, 200g, Pack), B2C vs B2B pricing tiers, shelf-life freshness badges. |
| **MOD-04** | **Cart & Dynamic Checkout** | Slide-over cart drawer, free-shipping threshold calculator, address picker, morning/evening delivery slot selector, atomic stock reservation. |
| **MOD-05** | **Order Lifecycle Management** | State machine (`PENDING` ➔ `CONFIRMED` ➔ `PROCESSING` ➔ `PACKED` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`), invoice and packing slip PDF generation. |
| **MOD-06** | **Payment & Reconciliation** | Razorpay / UPI gateway integration, automated webhook signature verification, partial and full refund workflows, COD payment reconciliation. |
| **MOD-07** | **Double-Entry Inventory** | Real-time stock ledger, separate finished goods vs raw materials, FIFO tracking, automated low-stock alerts, mandatory reason logging on adjustments. |
| **MOD-08** | **Production & Cultivation** | Batch lifecycle tracking (`PLANNED` to `COMPLETED`), spawn-to-substrate ratios, target yield forecasting, Biological Efficiency (BE %) analytics. |
| **MOD-09** | **Growing Rooms & Bed Matrix** | Interactive 2D visual room layout (Rooms ➔ Racks ➔ Beds), bed health status toggles, contamination logging and quarantine protocols. |
| **MOD-10** | **Harvest & Quality Grading** | Mobile-optimized fast harvest entry, multi-flush tracking (Flush #1, #2, #3), quality grade breakdown (Grade A, Grade B, Grade C, Spoilage), auto-stock sync. |
| **MOD-11** | **Procurement & Suppliers** | Supplier directory (Spawn, Straw, Bags, Disinfectant), purchase orders, material receipt verification with automatic raw material stock increment. |
| **MOD-12** | **Expense Ledger & Accounting** | Categorized expense entries (Electricity, Labor, Rent, Transport, Packaging), receipt photo attachments, payment method tracking. |
| **MOD-13** | **Delivery & Fleet Dispatch** | Order dispatch assignment, driver roster, delivery note management, delivery status updates. |
| **MOD-14** | **Executive Analytics & P&L** | Real-time Net Profit engine (`Gross Revenue - COGS - OpEx`), yield per bed, cost per kg, customer repeat rates, automated financial export. |

---

## 3. Database Entity-Relationship (ER) Architecture

The database operates on **MariaDB 11.x** with full referential integrity and optimized indexes:

```
  ┌──────────────┐         ┌───────────────────────┐         ┌──────────────────────┐
  │  SUPPLIERS   │────────►│ PURCHASES (Raw Mat.)  │────────►│  RAW MAT. INVENTORY  │
  └──────────────┘         └───────────────────────┘         └──────────┬───────────┘
                                                                        │
                                                                        ▼
  ┌──────────────┐         ┌───────────────────────┐         ┌──────────────────────┐
  │ GROWING ROOMS│────────►│  PRODUCTION BATCHES   │◄────────┤   GROWING BEDS       │
  └──────────────┘         └──────────┬────────────┘         └──────────────────────┘
                                      │
                                      ▼
  ┌──────────────┐         ┌───────────────────────┐         ┌──────────────────────┐
  │ QUALITY LOGS │◄────────┤   HARVEST RECORDS     │────────►│ FINISHED GOODS STOCK │
  └──────────────┘         └───────────────────────┘         └──────────┬───────────┘
                                                                        │
                                                                        ▼
  ┌──────────────┐         ┌───────────────────────┐         ┌──────────────────────┐
  │  CUSTOMERS   │────────►│   CUSTOMER ORDERS     │◄────────┤  PRODUCT CATALOG     │
  └──────────────┘         └──────────┬────────────┘         └──────────────────────┘
                                      │
                           ┌──────────┴────────────┐
                           ▼                       ▼
                    ┌──────────────┐        ┌──────────────┐
                    │   PAYMENTS   │        │  DELIVERIES  │
                    └──────────────┘        └──────────────┘
```

---

## 4. Key Mathematical Business Formulas

1. **Biological Efficiency (%):**
   $$\text{BE (\%)} = \left( \frac{\text{Total Fresh Harvest Weight (kg)}}{\text{Dry Substrate Weight (kg)}} \right) \times 100$$

2. **Unit Cost of Production (₹/kg):**
   $$\text{Unit Cost} = \frac{\text{Spawn Cost} + \text{Straw Cost} + \text{Allocated Power} + \text{Labor}}{\text{Total Harvest (kg)}}$$

3. **Net Profit (₹):**
   $$\text{Net Profit} = \text{Gross Revenue} - (\text{COGS} + \text{Operating Expenses} + \text{Logistics} + \text{Taxes})$$

---

## 5. Phased Delivery Roadmap Summary

```
 Sprint 1: Project Scaffolding, MariaDB Container & Prisma ORM setup.
 Sprint 2: NextAuth v5, Multi-Role RBAC & Customer Account portals.
 Sprint 3: Category Taxonomy, Product Catalog & Customer Storefront.
 Sprint 4: Shopping Cart, Multi-Step Checkout & Order State Machine.
 Sprint 5: Razorpay Gateway, Webhook Handler & Atomic Stock Locking.
 Sprint 6: Cultivation Batches, Growing Bed Matrix & Harvest Quality Grading.
 Sprint 7: Supplier Procurement, Expense Ledger & Real-Time P&L Center.
 Sprint 8: Audit Logging, Mobile PWA Hardening & Production Docker Deployment.
```
