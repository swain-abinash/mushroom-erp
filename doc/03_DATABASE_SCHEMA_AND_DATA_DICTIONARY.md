# 🍄 Mushroom Business Management & E-Commerce Platform (Mushroom ERP)
## Document 03: Relational Database Schema & Comprehensive Data Dictionary

**Project Name:** SporeERP  
**Database Engine:** MariaDB 11.x (InnoDB Engine)  
**Character Set:** `utf8mb4` | **Collation:** `utf8mb4_unicode_ci`  
**ORM:** Prisma ORM 5.x / 6.x  
**Document Code:** DOC-03-DB-SCHEMA  

---

## 1. High-Level Entity-Relationship (ER) Overview

The relational structure guarantees zero data anomalies and maintains referential integrity across the entire agronomy, supply chain, and e-commerce lifecycle:

```
┌──────────────┐         ┌───────────────────────┐         ┌──────────────────────┐
│  SUPPLIERS   │────────►│ PURCHASES (Raw Mat.)  │────────►│  RAW MAT. INVENTORY  │
└──────────────┘         └───────────────────────┘         └──────────┬───────────┘
                                                                      │ (Spawn/Straw)
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

## 2. Complete Data Dictionary by Module

### 2.1 Authentication & RBAC Module

#### Table: `users`
*Stores all authentication principals (Staff, Founders, and Customers).*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique user identifier. |
| `name` | VARCHAR(100) | NOT NULL | None | Full legal name. |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | None | Login email address. |
| `phone` | VARCHAR(20) | UNIQUE, NULLABLE | NULL | Mobile phone number. |
| `password_hash` | VARCHAR(255) | NOT NULL | None | Bcrypt hashed password. |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Account active state. |
| `email_verified`| DATETIME(3) | NULLABLE | NULL | Verification timestamp. |
| `created_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Record creation timestamp. |
| `updated_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Last modification timestamp. |

*Indexes:* `idx_users_email` ON (`email`), `idx_users_phone` ON (`phone`).

---

#### Table: `roles`
*Defines discrete system roles.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique role ID. |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | None | Role code (`FOUNDER_ADMIN`, `FARM_MANAGER`, etc.). |
| `display_name`| VARCHAR(100) | NOT NULL | None | Human-readable role title. |
| `description` | TEXT | NULLABLE | NULL | Detailed scope of responsibility. |
| `created_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Creation timestamp. |

---

#### Table: `permissions`
*Defines atomic resource permissions.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique permission ID. |
| `code` | VARCHAR(80) | UNIQUE, NOT NULL | None | e.g. `production:batch:create`, `finance:pnl:view`. |
| `module` | VARCHAR(50) | NOT NULL | None | Module group (`PRODUCTION`, `FINANCE`, etc.). |
| `description` | VARCHAR(255) | NOT NULL | None | Description of the permission. |

---

#### Table: `role_permissions`
*Maps permissions to roles.*

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `role_id` | VARCHAR(36) | FK ➔ `roles(id)` ON DELETE CASCADE | Target role ID. |
| `permission_id` | VARCHAR(36) | FK ➔ `permissions(id)` ON DELETE CASCADE | Target permission ID. |

*Primary Key:* (`role_id`, `permission_id`).

---

#### Table: `user_roles`
*Assigns roles to users.*

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | VARCHAR(36) | FK ➔ `users(id)` ON DELETE CASCADE | Target user ID. |
| `role_id` | VARCHAR(36) | FK ➔ `roles(id)` ON DELETE CASCADE | Target role ID. |

*Primary Key:* (`user_id`, `role_id`).

---

### 2.2 Customer & Address Module

#### Table: `customers`
*Customer profile details, loyalty points, and B2B GST credentials.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique customer ID. |
| `user_id` | VARCHAR(36) | UNIQUE, FK ➔ `users(id)` | None | Associated user account. |
| `customer_type` | ENUM('RETAIL', 'B2B_RESTAURANT', 'WHOLESALE') | NOT NULL | 'RETAIL' | Customer classification. |
| `company_name` | VARCHAR(150) | NULLABLE | NULL | Restaurant / Business name for B2B. |
| `gstin` | VARCHAR(15) | NULLABLE | NULL | GST Identification Number. |
| `credit_limit` | DECIMAL(10,2)| NOT NULL | 0.00 | Approved credit limit for B2B. |
| `total_orders` | INT UNSIGNED | NOT NULL | 0 | Lifetime delivered orders. |
| `created_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Registration timestamp. |

---

#### Table: `customer_addresses`
*Multiple shipping/billing addresses for customers.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique address ID. |
| `customer_id` | VARCHAR(36) | FK ➔ `customers(id)` ON DELETE CASCADE | None | Owning customer. |
| `address_type` | ENUM('HOME', 'WORK', 'RESTAURANT_KITCHEN', 'WAREHOUSE') | NOT NULL | 'HOME' | Address classification. |
| `recipient_name`| VARCHAR(100)| NOT NULL | None | Name of person receiving parcel. |
| `recipient_phone`| VARCHAR(20) | NOT NULL | None | Contact number for delivery. |
| `address_line1`| VARCHAR(255)| NOT NULL | None | House/Flat/Shop number, Building. |
| `address_line2`| VARCHAR(255)| NULLABLE | NULL | Street, Landmark, Area. |
| `city` | VARCHAR(80) | NOT NULL | None | City / Town. |
| `state` | VARCHAR(80) | NOT NULL | None | State / Province. |
| `pincode` | VARCHAR(10) | NOT NULL | None | Postal PIN code. |
| `latitude` | DECIMAL(10,8)| NULLABLE | NULL | GPS latitude for routing. |
| `longitude` | DECIMAL(11,8)| NULLABLE | NULL | GPS longitude for routing. |
| `is_default` | BOOLEAN | NOT NULL | FALSE | Default delivery address flag. |

*Indexes:* `idx_cust_addr_pincode` ON (`pincode`), `idx_cust_addr_cust` ON (`customer_id`).

---

### 2.3 Product Catalog & Categories Module

#### Table: `categories`
*Product taxonomy tree.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique category ID. |
| `name` | VARCHAR(100) | NOT NULL | None | e.g. "Fresh Mushrooms", "Mushroom Spawn". |
| `slug` | VARCHAR(120) | UNIQUE, NOT NULL | None | URL slug (`fresh-oyster-mushrooms`). |
| `description` | TEXT | NULLABLE | NULL | Category description for SEO. |
| `image_url` | VARCHAR(255) | NULLABLE | NULL | Header thumbnail image. |
| `parent_id` | VARCHAR(36) | NULLABLE, FK ➔ `categories(id)` | NULL | Self-referencing subcategory parent. |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Active status flag. |

---

#### Table: `products`
*The core e-commerce product catalog.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique product ID. |
| `category_id` | VARCHAR(36) | FK ➔ `categories(id)` ON DELETE RESTRICT | None | Product category. |
| `name` | VARCHAR(150) | NOT NULL | None | e.g. "Fresh Blue Oyster Mushrooms". |
| `slug` | VARCHAR(180) | UNIQUE, NOT NULL | None | SEO URL slug. |
| `sku` | VARCHAR(50) | UNIQUE, NOT NULL | None | Stock Keeping Unit code. |
| `description` | LONGTEXT | NOT NULL | None | Detailed rich-text description. |
| `unit_type` | ENUM('KG', 'GRAMS_200', 'GRAMS_500', 'PACK', 'BOTTLE') | NOT NULL | 'KG' | Unit of measurement. |
| `retail_price` | DECIMAL(10,2)| NOT NULL | None | Standard retail selling price (₹). |
| `b2b_price` | DECIMAL(10,2)| NULLABLE | NULL | Discounted bulk price for restaurants. |
| `min_order_qty`| DECIMAL(8,2) | NOT NULL | 1.00 | Minimum order quantity. |
| `shelf_life_days`| INT UNSIGNED| NOT NULL | 2 | Perishability warning threshold. |
| `status` | ENUM('DRAFT', 'PUBLISHED', 'OUT_OF_STOCK', 'ARCHIVED') | NOT NULL | 'DRAFT' | Publishing state. |
| `created_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Creation timestamp. |
| `updated_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Update timestamp. |

*Indexes:* `idx_prod_category` ON (`category_id`), `idx_prod_status` ON (`status`), `idx_prod_sku` ON (`sku`).

---

#### Table: `product_images`
*Product photography and media assets.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Image ID. |
| `product_id` | VARCHAR(36) | FK ➔ `products(id)` ON DELETE CASCADE | None | Target product. |
| `image_url` | VARCHAR(255) | NOT NULL | None | Cloudflare R2 / S3 image URL. |
| `alt_text` | VARCHAR(150) | NULLABLE | NULL | Accessibility alt text. |
| `display_order`| INT UNSIGNED | NOT NULL | 0 | Carousel display order. |
| `is_primary` | BOOLEAN | NOT NULL | FALSE | Primary thumbnail flag. |

---

### 2.4 Shopping Cart & Customer Orders Module

#### Table: `orders`
*Customer purchase orders with financial totals and delivery states.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique order ID. |
| `order_number` | VARCHAR(30) | UNIQUE, NOT NULL | None | Human code (e.g. `ORD-2026-10492`). |
| `customer_id` | VARCHAR(36) | FK ➔ `customers(id)` ON DELETE RESTRICT | None | Ordering customer. |
| `subtotal` | DECIMAL(10,2)| NOT NULL | None | Sum of item totals (₹). |
| `discount_amount`| DECIMAL(10,2)| NOT NULL | 0.00 | Coupon / loyalty discount. |
| `delivery_fee` | DECIMAL(10,2)| NOT NULL | 0.00 | Delivery charge (₹). |
| `tax_amount` | DECIMAL(10,2)| NOT NULL | 0.00 | GST amount (₹). |
| `total_amount` | DECIMAL(10,2)| NOT NULL | None | Final payable total (`subtotal + fee + tax - discount`). |
| `payment_status`| ENUM('UNPAID', 'PAID', 'FAILED', 'REFUNDED') | NOT NULL | 'UNPAID' | Payment status. |
| `order_status` | ENUM('PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED') | NOT NULL | 'PENDING' | Fulfillment state. |
| `delivery_address_json` | JSON | NOT NULL | None | Snapshot of delivery address at checkout time. |
| `delivery_slot`| VARCHAR(50) | NOT NULL | 'MORNING_HARVEST_DISPATCH' | Morning / Evening dispatch slot. |
| `notes` | TEXT | NULLABLE | NULL | Customer delivery instructions. |
| `created_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Order placement timestamp. |

*Indexes:* `idx_orders_customer` ON (`customer_id`), `idx_orders_status` ON (`order_status`), `idx_orders_created` ON (`created_at`).

---

#### Table: `order_items`
*Line items within an order.*

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | Unique order item ID. |
| `order_id` | VARCHAR(36) | FK ➔ `orders(id)` ON DELETE CASCADE | Parent order ID. |
| `product_id` | VARCHAR(36) | FK ➔ `products(id)` ON DELETE RESTRICT | Ordered product ID. |
| `quantity` | DECIMAL(8,2) | NOT NULL | Quantity ordered (e.g. 2.50 kg). |
| `unit_price` | DECIMAL(10,2)| NOT NULL | Unit price at time of purchase. |
| `total_price` | DECIMAL(10,2)| NOT NULL | `quantity * unit_price`. |

---

### 2.5 Inventory & Stock Transaction Ledger

#### Table: `inventory_items`
*Real-time stock balance per product or raw material.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Inventory item ID. |
| `product_id` | VARCHAR(36) | UNIQUE, NULLABLE, FK ➔ `products(id)` | NULL | If finished mushroom product. |
| `item_name` | VARCHAR(100) | NOT NULL | None | Name of item (Product or Raw Material). |
| `item_category`| ENUM('FINISHED_PRODUCT', 'RAW_MATERIAL', 'PACKAGING', 'EQUIPMENT') | NOT NULL | 'FINISHED_PRODUCT' | Category classification. |
| `available_stock`| DECIMAL(10,2)| NOT NULL | 0.00 | Available unreserved stock. |
| `reserved_stock` | DECIMAL(10,2)| NOT NULL | 0.00 | Stock locked in open checkout/orders. |
| `unit` | VARCHAR(20) | NOT NULL | 'KG' | Measurement unit (KG, BAGS, PCS). |
| `reorder_threshold`| DECIMAL(10,2)| NOT NULL | 5.00 | Low-stock notification trigger. |
| `updated_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Last balance update. |

---

#### Table: `inventory_transactions`
*Immutable audit trail of every stock modification (Double-Entry Ledger).*

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | Unique transaction record ID. |
| `inventory_item_id` | VARCHAR(36) | FK ➔ `inventory_items(id)` ON DELETE RESTRICT | Affected stock item. |
| `transaction_type` | ENUM('PURCHASE', 'PRODUCTION_USE', 'HARVEST_INJECTION', 'CUSTOMER_SALE', 'WASTAGE_SPOILAGE', 'RETURN', 'MANUAL_ADJUSTMENT') | NOT NULL | Type of movement. |
| `quantity` | DECIMAL(10,2) | NOT NULL | Positive (credit) or negative (debit) quantity. |
| `balance_after` | DECIMAL(10,2) | NOT NULL | Exact stock balance immediately following transaction. |
| `reference_type` | VARCHAR(50) | NULLABLE | e.g. `ORDER`, `HARVEST`, `PURCHASE_ORDER`. |
| `reference_id` | VARCHAR(36) | NULLABLE | ID of corresponding business document. |
| `reason` | VARCHAR(255) | NULLABLE | Explanation (e.g. "Contamination discard", "Fresh flush harvest"). |
| `performed_by` | VARCHAR(36) | FK ➔ `users(id)` | Actor who executed or triggered transaction. |
| `created_at` | DATETIME(3) | NOT NULL | Exact timestamp. |

*Indexes:* `idx_inv_tx_item` ON (`inventory_item_id`), `idx_inv_tx_created` ON (`created_at`).

---

### 2.6 Mushroom Cultivation & Growing Bed Module

#### Table: `growing_rooms`
*Indoor climate-controlled cultivation rooms.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Room ID. |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | None | e.g. "Fruiting Chamber Alpha", "Incubation Room 1". |
| `room_type` | ENUM('INCUBATION', 'FRUITING', 'SPAWN_LAB', 'SUBSTRATE_STERILIZATION') | NOT NULL | 'FRUITING' | Room function. |
| `capacity_beds` | INT UNSIGNED | NOT NULL | 200 | Maximum bed capacity. |
| `target_temp_c`| DECIMAL(4,1) | NOT NULL | 24.0 | Ideal temperature in Celsius. |
| `target_humidity`| DECIMAL(4,1) | NOT NULL | 85.0 | Target relative humidity %. |
| `is_active` | BOOLEAN | NOT NULL | TRUE | Room operational flag. |

---

#### Table: `production_batches`
*Master batch record for every cultivation cycle.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique batch ID. |
| `batch_number` | VARCHAR(40) | UNIQUE, NOT NULL | None | e.g. `BATCH-2026-OYS-042`. |
| `mushroom_type`| VARCHAR(60) | NOT NULL | 'Oyster Mushroom' | Mushroom variety. |
| `spawn_supplier_id`| VARCHAR(36) | NULLABLE, FK ➔ `suppliers(id)` | NULL | Spawn source. |
| `spawn_quantity_kg`| DECIMAL(8,2) | NOT NULL | None | Weight of spawn inoculated. |
| `substrate_type` | VARCHAR(80) | NOT NULL | 'Paddy Straw + Wheat Bran' | Substrate composition. |
| `substrate_dry_weight_kg`| DECIMAL(8,2)| NOT NULL | None | Baseline for Biological Efficiency calculation. |
| `number_of_beds`| INT UNSIGNED | NOT NULL | None | Total cylindrical beds inoculated. |
| `inoculation_date`| DATE | NOT NULL | None | Date spawn was mixed with substrate. |
| `expected_harvest_date`| DATE | NOT NULL | None | Projected first flush date. |
| `status` | ENUM('PLANNED', 'PREPARATION', 'SPAWNING', 'INCUBATION', 'FRUITING', 'HARVESTING', 'COMPLETED', 'CONTAMINATED') | NOT NULL | 'PLANNED' | Current biological stage. |
| `total_harvested_kg`| DECIMAL(8,2) | NOT NULL | 0.00 | Cumulative yield to date. |
| `biological_efficiency`| DECIMAL(5,2)| NULLABLE | NULL | Calculated BE % upon completion. |
| `created_by` | VARCHAR(36) | FK ➔ `users(id)` | None | Initiating farm manager. |
| `created_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Record creation timestamp. |

*Indexes:* `idx_batches_status` ON (`status`), `idx_batches_number` ON (`batch_number`).

---

#### Table: `growing_beds`
*Physical rack and bed location tracking.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique bed ID. |
| `batch_id` | VARCHAR(36) | FK ➔ `production_batches(id)` ON DELETE CASCADE | None | Parent cultivation batch. |
| `room_id` | VARCHAR(36) | FK ➔ `growing_rooms(id)` ON DELETE RESTRICT | None | Location room. |
| `rack_identifier`| VARCHAR(20) | NOT NULL | 'RACK-1' | Rack number. |
| `bed_identifier` | VARCHAR(20) | NOT NULL | 'BED-001' | Bed identifier tag. |
| `spawn_weight_grams`| INT UNSIGNED| NOT NULL | 250 | Spawn quantity in this bed. |
| `status` | ENUM('COLONIZING', 'PINNING', 'FRUITING', 'EXHAUSTED', 'CONTAMINATED') | NOT NULL | 'COLONIZING' | Bed status. |
| `contamination_type`| VARCHAR(80)| NULLABLE | NULL | e.g. "Trichoderma Green Mold", "Coprinus". |

---

### 2.7 Harvest & Quality Control Module

#### Table: `harvests`
*Daily picking and yield logging.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique harvest ID. |
| `batch_id` | VARCHAR(36) | FK ➔ `production_batches(id)` ON DELETE RESTRICT | None | Source cultivation batch. |
| `harvest_date` | DATE | NOT NULL | None | Date picked. |
| `flush_number` | INT UNSIGNED | NOT NULL | 1 | Flush sequence (1, 2, 3, etc.). |
| `total_weight_kg`| DECIMAL(8,2) | NOT NULL | None | Gross weight picked before grading. |
| `grade_a_kg` | DECIMAL(8,2) | NOT NULL | 0.00 | Premium whole fresh mushrooms. |
| `grade_b_kg` | DECIMAL(8,2) | NOT NULL | 0.00 | Minor stems/small buttons. |
| `grade_c_dry_kg`| DECIMAL(8,2) | NOT NULL | 0.00 | Diverted to dehydration/powder. |
| `wastage_kg` | DECIMAL(8,2) | NOT NULL | 0.00 | Spoiled / discarded yield. |
| `notes` | VARCHAR(255) | NULLABLE | NULL | Quality observation notes. |
| `harvested_by` | VARCHAR(36) | FK ➔ `users(id)` | None | Farm staff actor. |
| `created_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Timestamp logged. |

*Indexes:* `idx_harvests_batch` ON (`batch_id`), `idx_harvests_date` ON (`harvest_date`).

---

### 2.8 Procurement, Suppliers & Expenses Module

#### Table: `suppliers`
*Vendors for spawn, straw, poly bags, and equipment.*

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | Unique supplier ID. |
| `name` | VARCHAR(120) | NOT NULL | Supplier business name. |
| `contact_person` | VARCHAR(100) | NULLABLE | Sales representative name. |
| `phone` | VARCHAR(20) | NOT NULL | Contact phone number. |
| `email` | VARCHAR(120) | NULLABLE | Billing email. |
| `materials_supplied`| VARCHAR(255)| NOT NULL | e.g. "Oyster Spawn, Paddy Straw, 50-micron PP Bags". |
| `gstin` | VARCHAR(15) | NULLABLE | GST Tax ID. |
| `is_active` | BOOLEAN | NOT NULL (TRUE) | Active status. |

---

#### Table: `expenses`
*Comprehensive farm and operating cost ledger.*

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | VARCHAR(36) | PRIMARY KEY | UUID() | Unique expense ID. |
| `category` | ENUM('RAW_MATERIAL', 'ELECTRICITY', 'WATER', 'FARM_LABOR', 'PACKAGING', 'RENT', 'DELIVERY_FUEL', 'MARKETING', 'EQUIPMENT', 'MAINTENANCE', 'MISC') | NOT NULL | 'RAW_MATERIAL' | Expense classification. |
| `amount` | DECIMAL(10,2)| NOT NULL | None | Amount in Indian Rupees (₹). |
| `description` | VARCHAR(255) | NOT NULL | None | Detailed reason for expense. |
| `expense_date` | DATE | NOT NULL | None | Incurred date. |
| `payment_method`| ENUM('UPI', 'BANK_NEFT', 'CASH', 'DEBIT_CARD') | NOT NULL | 'UPI' | Payment mechanism. |
| `receipt_url` | VARCHAR(255) | NULLABLE | NULL | Scanned invoice / receipt image. |
| `recorded_by` | VARCHAR(36) | FK ➔ `users(id)` | None | Recording founder / staff member. |
| `created_at` | DATETIME(3) | NOT NULL | CURRENT_TIMESTAMP(3) | Entry timestamp. |

*Indexes:* `idx_expenses_category` ON (`category`), `idx_expenses_date` ON (`expense_date`).

---

### 2.9 System Audit Log & Business Settings

#### Table: `audit_logs`
*Immutable system-wide change log for complete accountability.*

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BIGINT UNSIGNED | PRIMARY KEY, AUTO_INCREMENT | Monotonic log sequence. |
| `actor_id` | VARCHAR(36) | FK ➔ `users(id)` | User who executed the mutation. |
| `action` | VARCHAR(50) | NOT NULL | e.g. `PRICE_UPDATE`, `STOCK_WRITE_OFF`, `ROLE_GRANT`. |
| `entity_type` | VARCHAR(50) | NOT NULL | e.g. `Product`, `InventoryItem`, `Order`. |
| `entity_id` | VARCHAR(36) | NOT NULL | Target entity identifier. |
| `old_state` | JSON | NULLABLE | Snapshot before modification. |
| `new_state` | JSON | NULLABLE | Snapshot after modification. |
| `ip_address` | VARCHAR(45) | NULLABLE | Client IP address. |
| `created_at` | DATETIME(3) | NOT NULL | Event timestamp. |

*Indexes:* `idx_audit_actor` ON (`actor_id`), `idx_audit_entity` ON (`entity_type`, `entity_id`), `idx_audit_created` ON (`created_at`).
