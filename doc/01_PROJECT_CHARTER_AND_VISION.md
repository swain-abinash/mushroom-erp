# 🍄 Mushroom Business Management & E-Commerce Platform (Mushroom ERP)
## Document 01: Project Charter, Product Vision & Strategic Framework

**Project Name:** SporeERP  
**Document Code:** DOC-01-CHARTER  
**Version:** 1.0.0-PROD  
**Status:** Approved  
**Author:** 2-Founder Executive Board  

---

## 1. Project Background & Problem Statement

Modern mushroom cultivation in India and global emerging markets represents a high-margin, rapid-cycle agricultural sector. Unlike conventional farming, mushroom cultivation operates in climate-controlled indoor environments with biological turnaround cycles as fast as **18 to 28 days** (for Oyster and Milky mushrooms).

However, commercial mushroom producers face severe operational inefficiencies:
1. **Siloed Record-Keeping:** Production batches, spawn dates, and harvest weights are maintained in paper registers; sales are coordinated via WhatsApp chats; customer ledgers and expenses reside in unformatted Excel files.
2. **Extreme Perishability:** Fresh harvested mushrooms have a shelf life of **24 to 48 hours** at room temperature and 5–7 days under refrigeration. A mismatch between harvest yield and daily retail orders causes immediate product spoilage and severe revenue leakage.
3. **No Batch-to-Profit Visibility:** Producers cannot easily calculate their actual **Cost per Kilogram** because substrate costs, spawn batches, electricity/humidifier expenses, and packaging are never accurately mapped against harvested yields.
4. **Order Double-Booking & Chaos:** Simultaneous orders from retail customers and wholesale restaurants frequently lead to stockouts, cancelled deliveries, and damaged customer trust.

---

## 2. Strategic Solution: The Unified SporeERP Platform

**SporeERP** unifies the entire enterprise into a single, cohesive **Next.js Full-Stack Application backed by MariaDB**. The system eliminates third-party software sprawl by serving three distinct user tiers through one codebase:

```
                                  SPORE ERP
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
   CUSTOMER PORTAL            FARM STAFF PORTAL           FOUNDER / EXECUTIVE
  • Fresh Mushroom Store     • Batch & Bed Tracking      • Financial P&L Ledger
  • Real-time Inventory      • Harvest Quality Grading   • Procurement & Expenses
  • Online Checkout & UPI    • Contamination Alerts      • Role-Based Permissions
  • Live Order Tracking      • Stock Ledger Injection    • Analytics & Growth KPIs
```

---

## 3. The 2-Founder Lean Business Architecture

The platform is designed around the practical realities of a **2-founder startup**:

```
 ┌────────────────────────────────────────┐     ┌────────────────────────────────────────┐
 │ FOUNDER A (Technical & Commercial CEO) │     │ FOUNDER B (Agronomy & Operations COO)  │
 ├────────────────────────────────────────┤     ├────────────────────────────────────────┤
 │ • Digital Storefront & Marketing       │     │ • Substrate Preparation & Inoculation  │
 │ • Customer Support & Order Pipeline    │     │ • Growing Room Climate & Sanitation    │
 │ • Payment Gateway Reconciliation       │     │ • Harvest Picking & Quality Control    │
 │ • Financial P&L & Expense Tracking     │     │ • Raw Material Supplier Management     │
 │ • Platform Security & Infrastructure   │     │ • Local Delivery & Dispatch Operations │
 └────────────────────────────────────────┘     └────────────────────────────────────────┘
                     ▲                                               ▲
                     │                                               │
                     └───────────────────────┬───────────────────────┘
                                             │
                                    UNIFIED DATABASE & ERP
                                 (Single Source of Truth)
```

---

## 4. End-to-End Mushroom Value Chain

Every physical process on the farm is modeled directly into the digital state machine:

```
  [1. Procurement] ──────> Suppliers deliver Paddy Straw, Wheat Bran, Grain Spawn, Poly bags, Disinfectants.
         │
         ▼
  [2. Substrate Prep] ───> Chemical / Steam sterilization of straw; moisture adjustment (65%).
         │
         ▼
  [3. Spawning / Beds] ──> Spawn mixed with substrate; packed into cylindrical beds in Racks/Rooms.
         │
         ▼
  [4. Incubation] ───────> Dark room phase; mycelium colonization (14–20 days); temperature 24–28°C.
         │
         ▼
  [5. Pinning & Fruiting]> Light and fresh air introduced; pinheads form; humidity maintained at 85–90%.
         │
         ▼
  [6. Harvest & Grading] ─> Fresh mushrooms picked; sorted into Grade A (whole), Grade B, Grade C (dry).
         │
         ▼
  [7. Inventory Entry] ──> Finished Goods inventory automatically incremented with batch pedigree.
         │
         ▼
  [8. E-Commerce Order] ──> Customer buys on web app; inventory atomically reserved; payment settled.
         │
         ▼
  [9. Packing & Dispatch]> Packed in breathable perforated punnets; dispatched for morning delivery.
         │
         ▼
 [10. Post-Sale & P&L] ──> Revenue recorded; expenses deducted; Net Profit & Biological Efficiency computed.
```

---

## 5. User Archetypes & Target Personas

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   USER PERSONAS & ACCESS TIERS                                  │
├───────────────────┬───────────────────────────┬─────────────────────────────────────────────────┤
│ Persona           │ Primary Motivation        │ Key Platform Touchpoints                        │
├───────────────────┼───────────────────────────┼─────────────────────────────────────────────────┤
│ 1. Retail Buyer   │ Buy ultra-fresh, organic  │ Storefront (`/`), Cart Drawer, Instant Razorpay │
│    (Consumer)     │ mushrooms delivered fast. │ Checkout, SMS/Email Order Status Tracking.      │
├───────────────────┼───────────────────────────┼─────────────────────────────────────────────────┤
│ 2. B2B Chef /     │ Reliable daily bulk supply│ B2B Tier Pricing (`/b2b`), Recurring Standing   │
│    Restaurant     │ with GST tax invoices.    │ Orders, Credit Term Tracking, Bulk Invoicing.   │
├───────────────────┼───────────────────────────┼─────────────────────────────────────────────────┤
│ 3. Farm Labor /   │ Simple, fast logging of   │ Mobile-first Bed Visualizer (`/admin/beds`),    │
│    Cultivator     │ daily spawn & harvest data│ Big-button Harvest Entry, Contamination Logger. │
├───────────────────┼───────────────────────────┼─────────────────────────────────────────────────┤
│ 4. Inventory /    │ Accurate stock counts &   │ Raw Material Purchase Receipt (`/admin/stock`), │
│    Packing Staff  │ zero packing mistakes.    │ Order Picking Lists, Packaging Stock Alerts.    │
├───────────────────┼───────────────────────────┼─────────────────────────────────────────────────┤
│ 5. Co-Founders    │ Total business control,   │ Executive KPI Center (`/admin/dashboard`),      │
│    (Super Admins) │ profitability & cashflow. │ Dynamic P&L Statements, User Permissions.       │
└───────────────────┴───────────────────────────┴─────────────────────────────────────────────────┘
```

---

## 6. Strategic Business Metrics & KPI Formulas

The platform embeds mathematical business intelligence into every dashboard:

### 6.1 Agronomy & Biological KPIs
1. **Biological Efficiency (BE %):**
   $$\text{Biological Efficiency (\%)} = \left( \frac{\text{Total Fresh Mushroom Harvest Weight (kg)}}{\text{Total Dry Substrate Weight (kg)}} \right) \times 100$$
   * *Benchmark:* $\ge 80\%$ for Oyster Mushrooms; $\ge 60\%$ for Milky Mushrooms.

2. **Contamination Loss Rate (%):**
   $$\text{Contamination Rate (\%)} = \left( \frac{\text{Number of Contaminated / Discarded Beds}}{\text{Total Inoculated Beds in Batch}} \right) \times 100$$
   * *Target:* $< 3\%$.

3. **Average Yield per Bed (kg/bed):**
   $$\text{Yield per Bed} = \frac{\text{Total Harvested Weight from Batch}}{\text{Total Active Beds in Batch}}$$

### 6.2 Financial & Commercial KPIs
1. **Unit Production Cost per Kilogram (₹/kg):**
   $$\text{Cost per KG} = \frac{\text{Raw Materials (Spawn + Straw)} + \text{Labor} + \text{Utilities (Power + Water)} + \text{Packaging}}{\text{Total Harvested Finished Stock (kg)}}$$

2. **Net Business Profit (₹):**
   $$\text{Net Profit} = \text{Gross Revenue} - (\text{COGS} + \text{Operating Expenses} + \text{Logistics} + \text{Taxes})$$

3. **Average Order Value (AOV):**
   $$\text{AOV} = \frac{\text{Total Sales Revenue}}{\text{Total Delivered Orders}}$$

4. **Fresh Stock Spoilage / Wastage Rate (%):**
   $$\text{Spoilage Rate (\%)} = \left( \frac{\text{Weight of Unsold Spoiled Mushrooms (kg)}}{\text{Total Harvested Mushroom Weight (kg)}} \right) \times 100$$
   * *Target:* $< 1.5\%$ (facilitated by automatic dehydration/powder conversion).

---

## 7. Commercial Scaling & SaaS Productization Roadmap

The software architecture is deliberately built with **tenant-ready abstractions** so that once the founders stabilize their own mushroom business, the software can be monetized as a **Vertical SaaS Platform** for thousands of commercial mushroom growers worldwide:

```
  Phase 1 (2026): In-House ERP & Local Direct-to-Consumer (D2C) E-Commerce
         │
         ▼
  Phase 2 (2027): Regional B2B Hub (Supplying Supermarkets, Hotels & Wholesalers)
         │
         ▼
  Phase 3 (2028): Multi-Tenant SaaS Engine (Subscription software for other mushroom farms)
```
