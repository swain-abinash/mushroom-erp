# 🍄 SporeERP — Mushroom Business Management & E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-11.x-003545?style=for-the-badge&logo=mariadb&logoColor=white)](https://mariadb.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](#)

> **SporeERP** is an all-in-one, full-stack **Mushroom Enterprise Resource Planning (ERP) & Direct-to-Consumer (D2C) / B2B E-Commerce Platform**. Engineered specifically for commercial mushroom producers, it unifies the entire lifecycle from raw material procurement, spawn inoculation, climate-controlled incubation, and multi-flush harvesting to atomic inventory reservation, online payments, cold-chain delivery, and real-time financial Profit & Loss (P&L) intelligence.

---

## 🌟 Key Highlights

- **🛒 Integrated Dual-Portal Architecture:** One unified Next.js 15 App Router application powering both the public customer storefront (`/`) and internal farm operations (`/admin`).
- **🧬 Complete Agronomy State Machine:** Track cultivation batches, growing rooms, racks, and beds across every biological stage (`SPAWNING` ➔ `INCUBATION` ➔ `FRUITING` ➔ `HARVESTING`).
- **⚖️ Double-Entry Inventory Ledger:** Eliminates stockouts and double-booking of fresh perishable mushrooms via MariaDB row-level locks (`SELECT ... FOR UPDATE`).
- **🌾 Harvest Quality Grading:** Fast mobile harvest logging with automated Grade A (Whole), Grade B (Buttons), and Grade C (Dehydration) splits that instantly update finished goods inventory.
- **🔐 Granular RBAC Security:** 6 distinct system roles (`Founder/Admin`, `Manager`, `Production Staff`, `Inventory Staff`, `Operations Staff`, `Customer`) governed by 40+ atomic permissions.
- **📊 Real-Time P&L Engine:** Dynamic financial calculations for Gross Profit, COGS, OpEx, Yield per Bed, Cost per Kilogram, and Biological Efficiency (BE %).

---

## 🔄 End-to-End Operational Lifecycle

```text
  [1. Procurement] ──────> Raw Material Suppliers (Paddy Straw, Grain Spawn, Poly Bags)
         │
         ▼
  [2. Substrate Prep] ───> Chemical / Steam Sterilization & Moisture Control (65%)
         │
         ▼
  [3. Spawning & Beds] ──> Cylindrical Beds Inoculated & Tagged in Rooms / Racks
         │
         ▼
  [4. Incubation] ───────> Mycelium Colonization (14–20 days) in Dark Chambers
         │
         ▼
  [5. Fruiting Stage] ───> Fresh Air & Humidity (85–90%) ➔ Rapid Pinhead Formation
         │
         ▼
  [6. Harvest & Grading] ─> Picking Flush #1, #2, #3 ➔ Grade A / B / C Separation
         │
         ▼
  [7. Inventory Entry] ──> Real-Time Stock Increment with Batch Pedigree
         │
         ▼
  [8. Customer Order] ───> D2C / B2B Checkout with Atomic Stock Reservation
         │
         ▼
  [9. Payment & Dispatch]> Razorpay / UPI Settlement ➔ Breathable Punnet Packing ➔ Delivery
         │
         ▼
 [10. P&L Analytics] ────> Real-Time Revenue, Expenses, Yield & Net Profit Dashboard
```

---

## 📚 Complete Technical Documentation Library

Full production-grade specifications and printable PDF handbooks are available in the repository:

| Document Code | Markdown Specification | Printable PDF | Scope |
| :---: | :--- | :--- | :--- |
| **DOC-00** | [`00_MASTER_PROJECT_PLAN_AND_ROADMAP.md`](./doc/00_MASTER_PROJECT_PLAN_AND_ROADMAP.md) | [`00_MASTER_PROJECT_PLAN_AND_ROADMAP.pdf`](./pdf/00_MASTER_PROJECT_PLAN_AND_ROADMAP.pdf) | 8-Sprint Roadmap, 2-Founder Matrix & DoD |
| **DOC-01** | [`01_PROJECT_CHARTER_AND_VISION.md`](./doc/01_PROJECT_CHARTER_AND_VISION.md) | [`01_PROJECT_CHARTER_AND_VISION.pdf`](./pdf/01_PROJECT_CHARTER_AND_VISION.pdf) | Business Charter, Value Chain & KPIs |
| **DOC-02** | [`02_SYSTEM_ARCHITECTURE_SPECIFICATION.md`](./doc/02_SYSTEM_ARCHITECTURE_SPECIFICATION.md) | [`02_SYSTEM_ARCHITECTURE_SPECIFICATION.pdf`](./pdf/02_SYSTEM_ARCHITECTURE_SPECIFICATION.pdf) | Next.js 15 Full-Stack Layered Architecture |
| **DOC-03** | [`03_DATABASE_SCHEMA_AND_DATA_DICTIONARY.md`](./doc/03_DATABASE_SCHEMA_AND_DATA_DICTIONARY.md) | [`03_DATABASE_SCHEMA_AND_DATA_DICTIONARY.pdf`](./pdf/03_DATABASE_SCHEMA_AND_DATA_DICTIONARY.pdf) | MariaDB 11.x Schema (20+ Tables) & Data Dictionary |
| **DOC-04** | [`04_PRISMA_SCHEMA_SPECIFICATION.prisma`](./doc/04_PRISMA_SCHEMA_SPECIFICATION.prisma) | [`04_PRISMA_SCHEMA_SPECIFICATION.pdf`](./pdf/04_PRISMA_SCHEMA_SPECIFICATION.pdf) | Production Prisma ORM Relational Schema |
| **DOC-05** | [`05_API_SPECIFICATION_AND_CONTRACTS.md`](./doc/05_API_SPECIFICATION_AND_CONTRACTS.md) | [`05_API_SPECIFICATION_AND_CONTRACTS.pdf`](./pdf/05_API_SPECIFICATION_AND_CONTRACTS.pdf) | REST Endpoints, Zod Schemas & Payloads |
| **DOC-06** | [`06_RBAC_AND_SECURITY_ARCHITECTURE.md`](./doc/06_RBAC_AND_SECURITY_ARCHITECTURE.md) | [`06_RBAC_AND_SECURITY_ARCHITECTURE.pdf`](./pdf/06_RBAC_AND_SECURITY_ARCHITECTURE.pdf) | NIST RBAC Matrix, Edge Guards & Audit Trails |
| **DOC-07** | [`07_BUSINESS_LOGIC_AND_OPERATIONAL_FLOWS.md`](./doc/07_BUSINESS_LOGIC_AND_OPERATIONAL_FLOWS.md) | [`07_BUSINESS_LOGIC_AND_OPERATIONAL_FLOWS.pdf`](./pdf/07_BUSINESS_LOGIC_AND_OPERATIONAL_FLOWS.pdf) | Agronomy State Machine & Concurrency Locking |
| **DOC-08** | [`08_FRONTEND_UI_UX_DESIGN_SPECIFICATION.md`](./doc/08_FRONTEND_UI_UX_DESIGN_SPECIFICATION.md) | [`08_FRONTEND_UI_UX_DESIGN_SPECIFICATION.pdf`](./pdf/08_FRONTEND_UI_UX_DESIGN_SPECIFICATION.pdf) | Design Tokens, Color Palettes & Layouts |
| **DOC-09** | [`09_DEPLOYMENT_DEVOPS_AND_INFRASTRUCTURE.md`](./doc/09_DEPLOYMENT_DEVOPS_AND_INFRASTRUCTURE.md) | [`09_DEPLOYMENT_DEVOPS_AND_INFRASTRUCTURE.pdf`](./pdf/09_DEPLOYMENT_DEVOPS_AND_INFRASTRUCTURE.pdf) | Docker Compose, Redis, Nginx SSL & Backups |
| **DOC-10** | [`10_MASTER_MUSHROOM_ERP_PRD_AND_TECHNICAL_SPEC.md`](./doc/10_MASTER_MUSHROOM_ERP_PRD_AND_TECHNICAL_SPEC.md) | [`10_MASTER_MUSHROOM_ERP_PRD_AND_TECHNICAL_SPEC.pdf`](./pdf/10_MASTER_MUSHROOM_ERP_PRD_AND_TECHNICAL_SPEC.pdf) | Unified Master PRD & Engineering Spec |

---

## 🛠️ Technology Stack

- **Frontend & Server Engine:** Next.js 15+ (App Router, Server Actions, React Server Components)
- **Language:** TypeScript 5.x (Strict Type Safety)
- **Database Engine:** MariaDB 11.x (InnoDB, Row-Level Locking, ACID Transactions)
- **ORM:** Prisma ORM 5.x / 6.x
- **Authentication & Security:** NextAuth.js (Auth.js v5) with JWT & Role-Based Middleware
- **Caching & Queues:** Redis 7.x (Rate Limiting, Pub/Sub Notifications)
- **Payment Gateway:** Razorpay / UPI Integration with Webhook Verification
- **DevOps & Hosting:** Docker Compose, Ubuntu 24.04 LTS, Nginx Reverse Proxy with Let's Encrypt SSL

---

## 👥 Authors & Governance

* **2-Founder Executive Board** — Mushroom Production & Commercial Operations
* **Lead System Architect** — Software Engineering & Infrastructure
