import { db } from "../lib/db";
import { registerCustomer } from "../services/auth.service";
import {
  createProduct,
  productWriteFromApi,
  createCategory,
} from "../services/catalog.service";
import { InventoryService } from "../services/inventory.service";
import { OrderService } from "../services/order.service";
import { ProductionService } from "../services/production.service";
import { FinanceService } from "../services/finance.service";
import {
  ItemCategory,
  InventoryTxType,
  OrderStatus,
  PaymentMethod,
  BatchStatus,
  BedStatus,
  RoomType,
  ExpenseCategory,
  UnitType,
  ProductStatus,
} from "@prisma/client";

async function runEndToEndTests() {
  console.log("=========================================================");
  console.log("🍄 SPORE ERP — COMPREHENSIVE END-TO-END FEATURE TEST RUN");
  console.log("=========================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? `— ${details}` : ""}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Database Connectivity & Founder Admin Seed
  // ---------------------------------------------------------------------------
  console.log("1. Verifying Database Connectivity & Core Seed Data...");
  const founder = await db.user.findFirst({
    where: { email: "admin@sporeerp.local" },
    include: { userRoles: { include: { role: true } } },
  });
  assert(!!founder, "Founder Admin exists in MariaDB");
  assert(
    founder!.userRoles.some((r) => r.role.name === "FOUNDER_ADMIN"),
    "Founder Admin has FOUNDER_ADMIN role",
  );

  const rolesCount = await db.role.count();
  assert(rolesCount === 6, "All 6 Seeded Roles exist in MariaDB", `Found ${rolesCount}`);

  // ---------------------------------------------------------------------------
  // TEST 2: Customer Registration & Authentication Flow
  // ---------------------------------------------------------------------------
  console.log("\n2. Testing Customer Registration & Profile...");
  const testCustomerEmail = `customer_${Date.now()}@sporefarm.local`;
  const registeredUser = await registerCustomer({
    name: "Arun Mohapatra",
    email: testCustomerEmail,
    phone: `986${Math.floor(1000000 + Math.random() * 9000000)}`,
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  assert(!!registeredUser.id, "Customer registered successfully");

  const customerProfile = await db.customer.findUnique({
    where: { userId: registeredUser.id },
  });
  assert(!!customerProfile, "Customer table record provisioned atomically");

  // ---------------------------------------------------------------------------
  // TEST 3: Catalog & Category Management
  // ---------------------------------------------------------------------------
  console.log("\n3. Testing Catalog, Categories & Product Provisioning...");
  let category = await db.category.findFirst({ where: { slug: "fresh-mushrooms" } });
  if (!category) {
    category = await createCategory(founder!.id, {
      name: "Fresh Mushrooms",
      description: "Harvested dawn fresh daily",
      isActive: true,
    });
  }
  assert(!!category, "Category exists or created");

  const testSku = `MUSH-OYS-BLU-${Date.now().toString(36).toUpperCase()}`;
  const testMushroomName = `Oyster Special ${Date.now().toString().slice(-4)}`;
  const product = await createProduct(
    founder!.id,
    productWriteFromApi({
      name: testMushroomName,
      categoryId: category.id,
      variety: testMushroomName,
      sku: testSku,
      shortDescription: "Tender, velvety caps harvested at 5:00 AM dawn.",
      description: "Organic Blue Oyster mushrooms grown on pasteurized straw substrate.",
      unitType: UnitType.KG,
      retailPrice: 220,
      minOrderQty: 1,
      shelfLifeDays: 3,
      isFeatured: true,
      allowBackorder: false,
      status: ProductStatus.PUBLISHED,
      openingStock: 30, // 30 KG Opening stock
      b2bPrice: 190,
      images: [],
    }),
  );
  assert(!!product.id, "Product created with SKU, shelf life and B2B tiers");

  // ---------------------------------------------------------------------------
  // TEST 4: Atomic Inventory Transaction Ledger
  // ---------------------------------------------------------------------------
  console.log("\n4. Testing Atomic Inventory Ledger & Stock Adjustments...");
  const invItem = await db.inventoryItem.findFirst({
    where: { productId: product.id },
  });
  assert(!!invItem, "Linked InventoryItem generated for finished mushroom product");
  assert(Number(invItem!.availableStock) === 30, "Opening stock of 30 KG recorded");

  // Manual stock adjustment (+5 KG)
  await InventoryService.adjustStock(
    {
      inventoryItemId: invItem!.id,
      transactionType: InventoryTxType.MANUAL_ADJUSTMENT,
      quantity: 5,
      reason: "Physical scale count reconciliation",
    },
    founder!.id,
  );
  let updatedInv = await db.inventoryItem.findUnique({ where: { id: invItem!.id } });
  assert(Number(updatedInv!.availableStock) === 35, "Stock adjustment +5 KG applied correctly (now 35 KG)");

  // Spoilage write-off (-2 KG)
  await InventoryService.adjustStock(
    {
      inventoryItemId: invItem!.id,
      transactionType: InventoryTxType.WASTAGE_SPOILAGE,
      quantity: -2,
      reason: "Minor transport trim loss",
    },
    founder!.id,
  );
  updatedInv = await db.inventoryItem.findUnique({ where: { id: invItem!.id } });
  assert(Number(updatedInv!.availableStock) === 33, "Spoilage deduction -2 KG applied correctly (now 33 KG)");

  // Verify transaction ledger
  const txList = await InventoryService.listTransactions(5);
  assert(txList.length >= 2, "Inventory transaction ledger captures every adjustment");

  // ---------------------------------------------------------------------------
  // TEST 5: Cart & Multi-Step Checkout & Stock Reservation
  // ---------------------------------------------------------------------------
  console.log("\n5. Testing Multi-Step Checkout & Atomic Stock Reservation...");
  const orderResult = await OrderService.createOrder(
    registeredUser.id,
    {
      items: [{ productId: product.id, quantity: 4 }], // Order 4 KG
      newAddress: {
        recipientName: "Arun Mohapatra",
        recipientPhone: "9861001234",
        addressLine1: "Plot 104, Forest Park",
        city: "Bhubaneswar",
        state: "Odisha",
        pincode: "751009",
        addressType: "HOME" as any,
        isDefault: true,
      },
      deliverySlot: "MORNING_HARVEST_DISPATCH",
      paymentMethod: PaymentMethod.CASH_ON_DELIVERY,
      notes: "Please call upon arrival at the gate.",
    },
    registeredUser.id,
  );
  assert(!!orderResult.orderNumber, `Order ${orderResult.orderNumber} created atomically`);
  assert(orderResult.totalAmount > 0, "Order total computed correctly");

  // Verify stock reservation (4 KG reserved, available = 33, reserved = 4, sellable = 29)
  updatedInv = await db.inventoryItem.findUnique({ where: { id: invItem!.id } });
  assert(
    Number(updatedInv!.reservedStock) === 4,
    "Reserved stock incremented to 4 KG to prevent overselling",
  );

  // ---------------------------------------------------------------------------
  // TEST 6: Order State Machine & Delivery Stock Fulfillment
  // ---------------------------------------------------------------------------
  console.log("\n6. Testing Order Lifecycle & State Machine Transitions...");
  const order = await OrderService.getOrder(orderResult.id);
  assert(order.orderStatus === OrderStatus.CONFIRMED, "Initial order status is CONFIRMED");

  // Transition to PROCESSING -> PACKED -> OUT_FOR_DELIVERY -> DELIVERED
  await OrderService.updateOrderStatus(order.id, OrderStatus.PROCESSING, "Harvesting batch", founder!.id);
  await OrderService.updateOrderStatus(order.id, OrderStatus.PACKED, "Packed in insulated carton", founder!.id);
  await OrderService.updateOrderStatus(order.id, OrderStatus.OUT_FOR_DELIVERY, "Loaded on morning van", founder!.id);
  await OrderService.updateOrderStatus(order.id, OrderStatus.DELIVERED, "Delivered and cash collected", founder!.id);

  const deliveredOrder = await OrderService.getOrder(order.id);
  assert(deliveredOrder.orderStatus === OrderStatus.DELIVERED, "Order reached DELIVERED state");
  assert(deliveredOrder.paymentStatus === "PAID", "COD Payment reconciled to PAID upon delivery");

  // Verify stock deduction upon delivery (available: 33 - 4 = 29 KG, reserved: 4 - 4 = 0 KG)
  updatedInv = await db.inventoryItem.findUnique({ where: { id: invItem!.id } });
  assert(
    Number(updatedInv!.availableStock) === 29,
    "Available stock deducted to 29 KG upon successful delivery",
  );
  assert(
    Number(updatedInv!.reservedStock) === 0,
    "Reserved stock released to 0 KG upon successful delivery",
  );

  // ---------------------------------------------------------------------------
  // TEST 7: Agronomy, Cultivation Batches, Beds & Harvest Injection
  // ---------------------------------------------------------------------------
  console.log("\n7. Testing Agronomy Batches, Growing Rooms & Rapid Harvest Sync...");
  const rooms = await ProductionService.listRooms();
  assert(rooms.length >= 1, "Growing rooms configured");

  // Create Batch
  const batch = await ProductionService.createBatch(
    {
      mushroomType: testMushroomName,
      roomId: rooms[0].id,
      spawnQuantityKg: 5,
      substrateType: "Paddy Straw + Wheat Bran",
      substrateDryWeightKg: 50,
      numberOfBeds: 10,
      inoculationDate: new Date().toISOString().slice(0, 10),
      expectedHarvestDays: 21,
    },
    founder!.id,
  );
  assert(!!batch.batchNumber, `Cultivation batch ${batch.batchNumber} created`);

  // Verify 10 beds allocated
  const roomMatrix = await ProductionService.getRoomMatrix(rooms[0].id);
  const allocatedBeds = roomMatrix.beds.filter((b) => b.batchId === batch.id);
  assert(allocatedBeds.length === 10, "10 growing beds provisioned in room grid");

  // Log Rapid Harvest (16 KG total: 13 KG Grade A, 3 KG Grade B)
  const harvest = await ProductionService.logHarvest(
    {
      batchId: batch.id,
      harvestDate: new Date().toISOString().slice(0, 10),
      flushNumber: 1,
      totalWeightKg: 16.0,
      gradeAKg: 13.0,
      gradeBKg: 3.0,
      gradeCDryKg: 0.0,
      wastageKg: 0.0,
      notes: "First dawn flush from BATCH 1",
    },
    founder!.id,
  );
  assert(!!harvest.id, "Harvest flush logged");

  // Verify AUTO-INJECTION into Finished Goods Inventory (29 + 16 = 45 KG)
  updatedInv = await db.inventoryItem.findUnique({ where: { id: invItem!.id } });
  assert(
    Number(updatedInv!.availableStock) === 45,
    "Harvested 16 KG auto-injected into Finished Goods inventory (now 45 KG)!",
  );

  // Verify Biological Efficiency calculated ((16 / 50) * 100 = 32%)
  const updatedBatch = await db.productionBatch.findUnique({ where: { id: batch.id } });
  assert(
    Number(updatedBatch!.biologicalEfficiency) === 32,
    "Batch biological efficiency calculated accurately (32.0%)",
  );

  // ---------------------------------------------------------------------------
  // TEST 8: Procurement & Suppliers
  // ---------------------------------------------------------------------------
  console.log("\n8. Testing Procurement & Raw Material Purchases...");
  const suppliers = await FinanceService.listSuppliers();
  assert(suppliers.length >= 1, "Suppliers directory loaded");

  const purchase = await FinanceService.createPurchase(
    {
      supplierId: suppliers[0].id,
      purchaseDate: new Date().toISOString().slice(0, 10),
      paymentStatus: "PAID" as any,
      items: [
        {
          materialName: "Organic Wheat Bran",
          quantity: 40,
          unit: "KG",
          unitPrice: 25,
        },
      ],
    },
    founder!.id,
  );
  assert(!!purchase.purchaseNumber, `Purchase Order ${purchase.purchaseNumber} recorded`);

  // Verify raw material inventory created/incremented
  const rawItem = await db.inventoryItem.findFirst({
    where: { itemName: "Organic Wheat Bran" },
  });
  assert(!!rawItem && Number(rawItem.availableStock) >= 40, "Raw material stock auto-updated in inventory ledger");

  // ---------------------------------------------------------------------------
  // TEST 9: Operational Expenses Ledger
  // ---------------------------------------------------------------------------
  console.log("\n9. Testing Farm Operational Expense Ledger...");
  const expense = await FinanceService.recordExpense(
    {
      category: ExpenseCategory.ELECTRICITY,
      amount: 1200,
      description: "Grow Room 1 AC Cooling & Humidifier power",
      expenseDate: new Date().toISOString().slice(0, 10),
      paymentMethod: "UPI",
    },
    founder!.id,
  );
  assert(!!expense.id, "Farm electricity expense recorded");

  const expensesList = await FinanceService.listExpenses();
  assert(expensesList.length >= 1, "Expense ledger contains recorded items");

  // ---------------------------------------------------------------------------
  // TEST 10: Real-Time Executive Profit & Loss (P&L) Engine
  // ---------------------------------------------------------------------------
  console.log("\n10. Testing Real-Time Executive P&L Engine...");
  const pnl = await FinanceService.getProfitAndLoss("all");
  assert(pnl.salesRevenue > 0, `Sales Revenue recorded: ₹${pnl.salesRevenue}`);
  assert(pnl.cogs > 0, `Cost of Goods Sold (COGS) recorded: ₹${pnl.cogs}`);
  assert(pnl.totalOperatingExpenses > 0, `Operating Expenses recorded: ₹${pnl.totalOperatingExpenses}`);
  assert(pnl.totalHarvestedKg > 0, `Total Harvest Yield: ${pnl.totalHarvestedKg} KG`);
  assert(pnl.costPerKgProduced > 0, `Unit Farm Cost per KG calculated: ₹${pnl.costPerKgProduced.toFixed(2)}/KG`);

  // ---------------------------------------------------------------------------
  // TEST 11: Founder Business Settings Persistence
  // ---------------------------------------------------------------------------
  console.log("\n11. Testing Founder Business Settings...");
  await db.businessSetting.upsert({
    where: { key: "store_name" },
    update: { value: "Spore Organic Mushroom Farm & Labs" },
    create: { key: "store_name", value: "Spore Organic Mushroom Farm & Labs" },
  });
  const updatedSetting = await db.businessSetting.findUnique({
    where: { key: "store_name" },
  });
  assert(
    updatedSetting?.value === "Spore Organic Mushroom Farm & Labs",
    "Founder business settings updated and verified",
  );

  // ---------------------------------------------------------------------------
  // TEST 12: Audit Logging Verification
  // ---------------------------------------------------------------------------
  console.log("\n12. Verifying Audit Trail Integrity...");
  const auditLogsCount = await db.auditLog.count();
  assert(auditLogsCount >= 5, `Audit trail recorded ${auditLogsCount} state transitions`);

  console.log("\n=========================================================");
  console.log(`🎉 ALL ${passedTests} / ${totalTests} END-TO-END FEATURE TESTS PASSED!`);
  console.log("=========================================================\n");
}

runEndToEndTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
