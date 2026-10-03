# 🍄 Mushroom Business Management & E-Commerce Platform (Mushroom ERP)
## Document 08: Frontend UI/UX Design System & Screen Layout Specifications

**Project Name:** SporeERP  
**Document Code:** DOC-08-UI-UX  
**Version:** 1.0.0-PROD  
**Design Paradigm:** Premium Organic Agritech • High-Contrast Dark/Light Modes • Micro-Interactions  

---

## 1. Design System Tokens & Color Palette

The visual identity combines organic earth tones with a sleek, modern, glassmorphic agritech aesthetic:

```
┌───────────────────────────────┬───────────────────────────┬───────────────────────────────────┐
│ Token Identifier              │ Hex / HSL Code            │ Semantic Usage                    │
├───────────────────────────────┼───────────────────────────┼───────────────────────────────────┤
│ `--color-forest-primary`      │ `#0F3A2F` (hsl 165, 59%, 15%) │ Primary brand, navbar, main CTA.  │
│ `--color-forest-hover`        │ `#165343` (hsl 165, 58%, 21%) │ Button hover, active navigation.  │
│ `--color-shiitake-ochre`      │ `#C28B53` (hsl 30, 48%, 54%)  │ Secondary accent, badges, badges. │
│ `--color-spore-ivory`         │ `#FBF9F5` (hsl 40, 45%, 97%)  │ Light theme page background.      │
│ `--color-surface-white`       │ `#FFFFFF` (hsl 0, 0%, 100%)   │ Card surfaces, modals, popovers.  │
│ `--color-charcoal-dark`       │ `#121816` (hsl 160, 14%, 8%)  │ Admin ERP background (Dark mode). │
│ `--color-surface-charcoal`    │ `#1B2421` (hsl 160, 14%, 12%) │ Admin ERP card container.         │
│ `--color-success-mint`        │ `#22C55E` (hsl 142, 71%, 45%) │ In-Stock, Healthy Bed, Paid badge.│
│ `--color-alert-coral`         │ `#E05252` (hsl 0, 70%, 60%)   │ Contamination, Out of Stock, Debt.│
│ `--color-warning-amber`       │ `#F59E0B` (hsl 38, 92%, 50%)  │ Low Stock, Pending Confirmation.  │
└───────────────────────────────┴───────────────────────────┴───────────────────────────────────┘
```

---

## 2. Typography & Font Hierarchy

1. **Display & Headings:** `Outfit` (Google Fonts, weights 600, 700, 800) — Modern geometric elegance for hero titles, section headings, and product names.
2. **Body & Interface:** `Plus Jakarta Sans` (Google Fonts, weights 400, 500, 600) — Highly legible UI font optimized for dense data tables, forms, and product specs.
3. **Codes, SKUs & Financial Figures:** `JetBrains Mono` (weights 500, 700) — Monospace precision for Batch IDs (`BATCH-2026-042`), SKU codes, currency amounts (₹), and temperature/humidity readings.

---

## 3. Customer Portal Screen Specifications

### 3.1 Storefront Homepage (`/`)
* **Hero Section:** Full-width organic visual banner featuring fresh oyster mushrooms with live badge: *"Harvested Today Morning • 100% Chemical-Free & Local"*.
* **Mushroom Variety Carousel:** Interactive cards highlighting Blue Oyster, Pink Oyster, King Oyster, White Milky, and Dry Powder.
* **Why Our Mushrooms Section:** 4 Value Props (Zero Pesticides, 4-Hour Farm-to-Kitchen Dispatch, Nutrient-Dense, Sustainable Substrate).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  🍄 SPORE MUSHROOMS               Products   Recipes   About   B2B Wholesale   🛒 Cart(2)│
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   FRESH FARM HARVEST TO YOUR KITCHEN IN HOURS                                          │
│   Grown sustainably on pasteurized straw. Harvested daily at 5:00 AM.                  │
│                                                                                        │
│   [ 🛒 Shop Fresh Harvest ]        [ 👨‍🍳 B2B Bulk for Chefs ]                           │
│                                                                                        │
│   🟢 TODAY'S HARVEST: 38.5 KG AVAILABLE NOW • NEXT DISPATCH: 11:00 AM                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Product Detail Page (PDP) (`/products/[slug]`)
* **Left Column:** High-res image gallery with thumbnail strip.
* **Right Column:**
  * Product Title, SKU code, Category badge.
  * Price: **₹220 / kg** (or ₹110 / 500g pack).
  * Freshness Guarantee Card: *"Picked from Batch BATCH-2026-048 • Harvest Date: Today"*.
  * Quantity Stepper (+ / -) and *"Add to Cart"* button with dynamic stock countdown.
  * Tabbed Info: Nutritional Profile (High Protein, Vitamin D), Cooking & Storage Guide (Store in paper bag at 4°C).

---

### 3.3 Shopping Cart Drawer & Checkout Funnel
* **Slide-Over Drawer:** Real-time stock reservation indicator; free shipping threshold progress bar (*"Add ₹160 more for Free Morning Delivery"*).
* **3-Step Checkout:**
  1. Address Selection (Home / Work / Saved addresses with PIN code validator).
  2. Delivery Slot (Morning Harvest 8 AM–11 AM vs Evening 4 PM–7 PM).
  3. Razorpay One-Click UPI / Card / COD payment.

---

## 4. Business Admin ERP Screen Specifications

### 4.1 Executive Founder Command Center (`/admin/dashboard`)
* **Header:** Date range picker, quick harvest logging trigger, system health status.
* **Metric Cards:**
  1. **Today's Revenue:** ₹14,200 (+18% vs yesterday).
  2. **Active Orders:** 28 (4 Pending, 12 Packing, 12 Out for Delivery).
  3. **Fresh Mushroom Stock:** 48.5 KG across 3 varieties.
  4. **Active Grow Batches:** 6 batches (360 active beds in incubation/fruiting).
  5. **Estimated Net Profit (Month-to-Date):** ₹54,300 (Net Margin 38.2%).
* **Visual Charts:**
  * Daily Harvest Yield vs Sales Demand (Line chart).
  * Monthly Revenue vs Operating Expenses (Stacked bar chart).
  * Room Climate Telemetry (Temperature & Humidity meters for Room 1 & 2).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  🍄 SPORE ERP | Executive Hub                           [ ⚡ Quick Harvest ] [ 👤 Admin ]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ Today's Sales  │  │ Active Orders  │  │ Live Stock (KG)│  │ Net Profit MTD │        │
│  │ ₹14,200.00     │  │ 28 Orders      │  │ 48.50 KG       │  │ ₹54,300 (38%)  │        │
│  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘        │
│                                                                                        │
│  [ CULTIVATION PIPELINE ]                                                              │
│  • Batch 048 (Oyster) ──► FRUITING (Day 18) ──► Expected Yield: 32kg (Tomorrow)       │
│  • Batch 049 (Milky)  ──► INCUBATION (Day 8) ──► Colonization: 85% Healthy             │
│  • Batch 050 (Oyster) ──► PREPARATION       ──► 100kg Straw Pasteurized                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Growing Room & Bed Visualizer (`/admin/rooms`)
* Interactive 2D matrix of Room Racks and Beds.
* Color-coded bed tiles:
  * 🟢 **Green:** Healthy Mycelium / Fruiting (Click to view spawn weight & flush count).
  * 🟡 **Yellow:** Pinheads Forming (Ready in 48h).
  * 🔴 **Red:** Contaminated (Single click opens quarantine & discard modal).
  * ⚪ **Gray:** Harvested / Spent Substrate.

---

### 4.3 Fast Mobile Harvest Logging Modal (`/admin/harvest/new`)
* Designed for farm staff wearing rubber gloves inside humid grow rooms:
  * Giant numeric numpad for quick weight entry.
  * Batch dropdown with latest active batches prioritized.
  * Automatic Grade A / Grade B weight split calculator.
  * *"Save & Update Inventory"* 1-click confirmation with sound haptic feedback.
