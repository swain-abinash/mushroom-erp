# 🍄 Mushroom Business Management & E-Commerce Platform (Mushroom ERP)
## Document 07: Business Domain Logic & Operational Workflow Specifications

**Project Name:** SporeERP  
**Document Code:** DOC-07-BIZ-LOGIC  
**Version:** 1.0.0-PROD  
**Domain Focus:** Agronomy State Machine, Double-Entry Inventory, Order Lifecycle & P&L Engine  

---

## 1. End-to-End Mushroom Agronomy & Cultivation Lifecycle

Mushroom cultivation requires precise biological stage transitions. The `ProductionBatch` state machine governs each phase:

```
  [1. PLANNED]
        │  (Spawn & Straw Procured)
        ▼
  [2. PREPARATION]
        │  (Paddy straw chemical/steam sterilization; moisture checked at 65%)
        ▼
  [3. SPAWNING]
        │  (Spawn mixed with cooled substrate; packed into cylindrical beds)
        │  • Generates Bed IDs (e.g. `BED-001` .. `BED-080`)
        │  • Records spawn consumption in `inventory_transactions`
        ▼
  [4. INCUBATION]
        │  (Dark room phase; temperature 24–28°C; relative humidity 70–80%)
        │  • Mycelium colonizes substrate (14–20 days)
        │  • Staff records bed colonization progress & flags contamination
        ▼
  [5. FRUITING]
        │  (Fresh air & indirect light introduced; humidity boosted to 85–90%)
        │  • Pinheads emerge within 3–5 days
        │  • Rapid mushroom cap expansion (2–3 days)
        ▼
  [6. HARVESTING]
        │  (Daily picking flushes: Flush #1, Flush #2, Flush #3)
        │  • Daily harvest logs recorded with quality grade breakdown
        │  • Grade A/B auto-injected into Finished Goods stock
        ▼
  [7. COMPLETED / DISCARDED]
        • Substrate spent or contamination reached limit
        • Calculates final Biological Efficiency %: `(Total Yield kg / Dry Substrate kg) * 100`
```

---

## 2. Atomic Customer Checkout & Concurrency Locking Flow

To guarantee that fresh perishable mushrooms are never oversold during high-traffic flash sales or morning harvest drops, checkout executes as an atomic database transaction:

```
                  CUSTOMER CLICKS "PLACE ORDER & PAY"
                                   │
                                   ▼
                    [BEGIN MariaDB TRANSACTION]
                                   │
                                   ▼
                 Acquire Row-Level Lock on Inventory
                 `SELECT * FROM inventory_items WHERE product_id = ? FOR UPDATE;`
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
          (Stock >= Quantity)            (Stock < Quantity)
                    │                             │
                    ▼                             ▼
       1. Reserve Stock Amount:           1. [ROLLBACK TRANSACTION]
          `available_stock -= qty`        2. Return 409 Conflict:
          `reserved_stock += qty`            "Insufficient Stock"
                    │
       2. Insert `Order` (PENDING, UNPAID)
       3. Insert `OrderItems`
       4. Insert `OrderStatusHistory`
       5. Initialize Razorpay Gateway Order
                    │
                    ▼
          [COMMIT TRANSACTION]
                    │
                    ▼
        Customer Redirected to Razorpay Checkout Modal
                    │
        ┌───────────┴───────────┐
        │                       │
 (Payment Success)       (Payment Failed / Abandoned > 15m)
        │                       │
        ▼                       ▼
  • Webhook Received      • Release Reserved Stock:
  • `order_status = CONFIRMED` `available_stock += qty`
  • `payment_status = PAID`    `reserved_stock -= qty`
  • `reserved_stock -= qty`  • `order_status = CANCELLED`
  • Log `CUSTOMER_SALE` tx
```

---

## 3. Wastage, Spoilage & Biological Contamination Handling

### 3.1 Farm-Floor Contamination (Beds)
When agronomy staff discovers green mold (*Trichoderma*), ink cap (*Coprinus*), or bacterial blotch during daily bed inspection:
1. Staff marks bed status as `CONTAMINATED` in the Growing Room Bed Grid (`/admin/rooms`).
2. Bed is immediately quarantined and removed from the room to prevent airborne spore cross-contamination.
3. System logs `CONTAMINATION_LOSS` in `ProductionBatch`:
   $$\text{Batch Contamination Rate (\%)} = \left( \frac{\text{Contaminated Beds}}{\text{Total Initial Beds}} \right) \times 100$$
4. Cost of lost spawn and substrate is automatically reflected in the batch cost accounting.

### 3.2 Post-Harvest Fresh Spoilage (Cold-Chain Expiry)
Fresh mushrooms unsold within **48 hours** are automatically flagged by the FIFO freshness monitor:
* **Option A (Dehydration Conversion):** Staff routes unsold Grade A mushrooms into the dehydrator. System debits Fresh Inventory and credits Dry Mushroom Inventory at a **10:1 ratio** (10kg fresh = 1kg dry mushroom).
* **Option B (Wastage Write-Off):** If spoiled, staff records `WASTAGE_SPOILAGE` in `inventory_transactions`. System logs exact financial write-off value (`Quantity * Cost per KG`).

---

## 4. Multi-Tier B2B Pricing & Bulk Quotation Engine

The catalog dynamically renders prices based on customer account classification:

```
┌─────────────────────────┬──────────────┬──────────────────────────┬────────────────────────┐
│ Product Item            │ Retail (D2C) │ B2B Restaurant Tier      │ Wholesale Distributor  │
├─────────────────────────┼──────────────┼──────────────────────────┼────────────────────────┤
│ Fresh Blue Oyster (1kg) │ ₹220 / kg    │ ₹170 / kg (Min 5kg order)│ ₹140 / kg (Min 25kg)   │
│ Fresh Milky (1kg)       │ ₹240 / kg    │ ₹190 / kg (Min 5kg order)│ ₹160 / kg (Min 25kg)   │
│ Premium Dry Oyster (100g│ ₹180 / pack  │ ₹140 / pack (Min 10 pk)  │ ₹115 / pack (Min 50 pk)│
└─────────────────────────┴──────────────┴──────────────────────────┴────────────────────────┘
```

* **Credit Terms for B2B:** Approved restaurants can place orders on a `NET_15` or `NET_30` invoice cycle up to their assigned `credit_limit`. Orders automatically generate GST-compliant tax invoices with HSN code `07095900`.

---

## 5. Real-Time Profit & Loss (P&L) Calculation Engine

The financial engine aggregates operational data dynamically without batch delays:

```
  [GROSS SALES REVENUE]
  = Total Completed B2C Orders + Total B2B Invoiced Sales + Spawn Sales
             │
             ▼  MINUS
  [COST OF GOODS SOLD (COGS)]
  = Grain Spawn Purchases + Paddy Straw / Substrate + Packaging Punnets / Bags
             │
             ▼  EQUALS
  [GROSS PROFIT]  ───► (Target Gross Margin: 70% – 80%)
             │
             ▼  MINUS
  [OPERATING EXPENSES (OpEx)]
  = Farm Electricity (ACs/Humidifiers) + Farm Labor Wages + Rent + Delivery Fuel + Marketing
             │
             ▼  EQUALS
  [NET BUSINESS PROFIT]  ───► (Target Net Margin: 35% – 45%)
```
