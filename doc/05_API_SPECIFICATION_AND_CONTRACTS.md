# 🍄 Mushroom Business Management & E-Commerce Platform (Mushroom ERP)
## Document 05: REST API Specification & Endpoint Contracts

**Project Name:** SporeERP  
**Document Code:** DOC-05-API-SPEC  
**Base URL:** `https://app.sporemushroom.com/api/v1` (Production) / `http://localhost:3000/api/v1` (Local)  
**Authentication:** Bearer JWT / HTTP-Only Session Cookie (`__Secure-authjs.session-token`)  
**Data Format:** JSON (`application/json; charset=utf-8`)  

---

## 1. Global API Standards & Error Envelope

All responses adhere to a consistent JSON envelope structure:

### 1.1 Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-03T10:30:00.000Z",
    "requestId": "req_01h9x3y8z..."
  }
}
```

### 1.2 Error Response Envelope (RFC 7807 Compliant)
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity (4.00 kg) exceeds currently available unreserved stock (1.50 kg).",
    "details": [
      { "field": "items[0].quantity", "issue": "max_available_exceeded", "available": 1.5 }
    ]
  },
  "meta": {
    "timestamp": "2026-10-03T10:30:00.000Z",
    "requestId": "req_01h9x3y8z..."
  }
}
```

---

## 2. API Endpoint Directory by Domain

### 2.1 Authentication & Session (`/api/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register new customer profile. |
| `POST` | `/api/auth/callback/credentials` | Public | Authenticate user via email + password. |
| `GET` | `/api/auth/session` | Authenticated | Retrieve active session claims and permissions. |
| `POST` | `/api/auth/forgot-password` | Public | Trigger password reset verification email. |

---

### 2.2 Product Catalog (`/api/v1/products`)

#### `GET /api/v1/products`
*Fetches public product catalog with category, price range, and availability filters.*
* **Query Parameters:**
  * `category` (string, optional) — Category slug.
  * `status` (string, default: `PUBLISHED`) — `DRAFT`, `PUBLISHED`, `OUT_OF_STOCK`.
  * `page` (int, default: 1), `limit` (int, default: 20).
* **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "prod_01h9a8b7c6",
        "name": "Fresh Blue Oyster Mushrooms",
        "slug": "fresh-blue-oyster-mushrooms",
        "sku": "MUSH-OYS-BLU-1KG",
        "retailPrice": 220.00,
        "b2bPrice": 170.00,
        "unitType": "KG",
        "availableStock": 42.50,
        "shelfLifeDays": 2,
        "primaryImage": "https://cdn.sporemushroom.com/products/blue-oyster-1.jpg",
        "status": "PUBLISHED"
      }
    ],
    "pagination": { "total": 14, "page": 1, "totalPages": 1 }
  }
}
```

#### `POST /api/v1/products`
*Creates a new catalog product (Requires `catalog:product:create` permission).*
* **Request Body (Zod Validated):**
```json
{
  "categoryId": "cat_01h9a1...",
  "name": "Fresh Pink Oyster Mushrooms",
  "slug": "fresh-pink-oyster-mushrooms",
  "sku": "MUSH-OYS-PNK-1KG",
  "description": "Exotic vibrant pink oyster mushrooms with a delicate savory flavor.",
  "unitType": "KG",
  "retailPrice": 250.00,
  "b2bPrice": 190.00,
  "minOrderQty": 0.50,
  "shelfLifeDays": 2,
  "status": "PUBLISHED",
  "imageUrls": [
    { "imageUrl": "https://cdn.sporemushroom.com/products/pink-1.jpg", "isPrimary": true }
  ]
}
```
* **Response `201 Created`:** Returns created product record with assigned UUID.

---

### 2.3 Customer Orders & Checkout (`/api/v1/orders`)

#### `POST /api/v1/orders`
*Executes atomic order creation, reserves stock, and prepares payment initiation.*
* **Request Body:**
```json
{
  "addressId": "addr_01h9x7...",
  "deliverySlot": "MORNING_HARVEST_DISPATCH",
  "paymentMethod": "UPI_RAZORPAY",
  "customerNotes": "Please leave at front security desk if unavailable.",
  "items": [
    { "productId": "prod_01h9a8b7c6", "quantity": 2.00 }
  ]
}
```
* **Transactional Behavior:**
  1. Checks `available_stock >= requested_quantity` under row-level lock (`FOR UPDATE`).
  2. Creates `Order` with `order_status = 'PENDING'` and `payment_status = 'UNPAID'`.
  3. Increments `reserved_stock` and decrements `available_stock`.
  4. Generates Razorpay Order ID and returns checkout credentials.
* **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "orderId": "ord_01h9z2...",
    "orderNumber": "ORD-2026-10492",
    "totalAmount": 440.00,
    "paymentDetails": {
      "gateway": "RAZORPAY",
      "razorpayOrderId": "order_Nz9X1234567890",
      "currency": "INR",
      "keyId": "rzp_live_xxxxxxxxxxxx"
    }
  }
}
```

#### `PATCH /api/v1/orders/:id/status`
*Transitions order fulfillment status (Requires `orders:manage` permission).*
* **Request Body:**
```json
{
  "status": "PACKED",
  "notes": "Packed in 500g biodegradable punnets with ice-gel pack."
}
```
* **Response `200 OK`:** Updates `order_status`, appends entry to `order_status_history`, and dispatches notification.

---

### 2.4 Payments & Webhook (`/api/v1/payments`)

#### `POST /api/v1/payments/webhook`
*Webhook endpoint for payment gateway callbacks (Razorpay).*
* **Headers:** `x-razorpay-signature: hex_hmac_sha256_hash`
* **Handling Logic:**
  1. Verifies HMAC-SHA256 signature using secret `RAZORPAY_WEBHOOK_SECRET`.
  2. On `payment.captured`: Updates `payment_status = 'PAID'`, `order_status = 'CONFIRMED'`.
  3. Logs `InventoryTransaction` of type `CUSTOMER_SALE`.
  4. Triggers order confirmation email to customer.
* **Response `200 OK`:** `{"status": "ok"}`

---

### 2.5 Mushroom Cultivation Batches (`/api/v1/production`)

#### `POST /api/v1/production/batches`
*Initiates a new cultivation batch (Requires `production:batch:create`).*
* **Request Body:**
```json
{
  "batchNumber": "BATCH-2026-OYS-048",
  "mushroomType": "Blue Oyster Mushroom",
  "spawnSupplierId": "sup_01h8v1...",
  "spawnQuantityKg": 25.00,
  "substrateType": "Pasteurized Paddy Straw + 5% Rice Bran",
  "substrateDryWeightKg": 100.00,
  "numberOfBeds": 80,
  "inoculationDate": "2026-10-04",
  "expectedHarvestDate": "2026-10-24",
  "roomId": "room_alpha_fruiting",
  "rackIdentifier": "RACK-2"
}
```
* **Response `201 Created`:** Creates batch record, automatically generates 80 bed records (`BED-001` through `BED-080`), and deducts 25kg spawn and 100kg straw from Raw Materials inventory.

#### `PATCH /api/v1/production/batches/:id/status`
*Updates batch biological status (`SPAWNING` ➔ `INCUBATION` ➔ `FRUITING` ➔ `COMPLETED`).*

---

### 2.6 Daily Harvest Logging (`/api/v1/harvest`)

#### `POST /api/v1/harvest`
*Logs fresh picked harvest and syncs finished goods inventory in real time.*
* **Request Body:**
```json
{
  "batchId": "batch_01h9z5...",
  "harvestDate": "2026-10-24",
  "flushNumber": 1,
  "totalWeightKg": 28.50,
  "gradeAKg": 22.00,
  "gradeBKg": 4.50,
  "gradeCDryKg": 1.50,
  "wastageKg": 0.50,
  "notes": "Excellent pinhead development. Clean harvest with zero spore drop."
}
```
* **Atomic Execution:**
  1. Creates `Harvest` record with grade distribution.
  2. Updates `ProductionBatch.total_harvested_kg += 28.50`.
  3. Increments finished goods `InventoryItem` for Fresh Oyster Mushrooms by `26.50 kg` (Grade A + Grade B).
  4. Increments raw material `InventoryItem` for Dehydration by `1.50 kg` (Grade C).
  5. Inserts `InventoryTransaction` of type `HARVEST_INJECTION`.
* **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "harvestId": "hrv_01ha7x...",
    "syncedInventory": {
      "freshMushroomAddedKg": 26.50,
      "dehydrationStockAddedKg": 1.50
    },
    "currentBatchTotalHarvestedKg": 28.50,
    "currentBatchBiologicalEfficiency": 28.50
  }
}
```

---

### 2.7 Expenses & Financial Reporting (`/api/v1/expenses` & `/api/v1/reports/pnl`)

#### `POST /api/v1/expenses`
*Records business operating cost or raw material payment.*
* **Request Body:**
```json
{
  "category": "ELECTRICITY",
  "amount": 4850.00,
  "description": "Fruiting Room 1 & 2 Humidifiers + AC bill for September",
  "expenseDate": "2026-10-02",
  "paymentMethod": "UPI",
  "receiptUrl": "https://cdn.sporemushroom.com/receipts/eb-bill-sept.pdf"
}
```
* **Response `201 Created`:** Returns expense record.

#### `GET /api/v1/reports/pnl`
*Real-time Profit & Loss statement calculation.*
* **Query Parameters:** `startDate=2026-10-01&endDate=2026-10-31`
* **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "period": { "startDate": "2026-10-01", "endDate": "2026-10-31" },
    "revenue": {
      "retailSales": 84500.00,
      "b2bSales": 42000.00,
      "spawnSales": 12500.00,
      "grossRevenue": 139000.00
    },
    "cogs": {
      "spawnPurchases": 16000.00,
      "paddyStrawPurchases": 9500.00,
      "packagingSupplies": 4200.00,
      "totalCOGS": 29700.00
    },
    "grossProfit": 109300.00,
    "grossMarginPercent": 78.63,
    "operatingExpenses": {
      "electricity": 9200.00,
      "farmLabor": 24000.00,
      "deliveryFuel": 3800.00,
      "rent": 15000.00,
      "marketing": 4500.00,
      "misc": 1800.00,
      "totalOpEx": 58300.00
    },
    "netProfit": 51000.00,
    "netMarginPercent": 36.69
  }
}
```
