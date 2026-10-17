import "server-only";
import { Prisma, PaymentStatus, InventoryTxType, ItemCategory, ExpenseCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { AuditService } from "@/services/audit.service";
import type { SupplierInput, PurchaseInput, ExpenseInput } from "@/lib/validations/finance";

export class FinanceService {
  /**
   * List suppliers (auto-seeds defaults if empty)
   */
  static async listSuppliers() {
    let suppliers = await db.supplier.findMany({
      orderBy: { name: "asc" },
    });

    if (suppliers.length === 0) {
      await db.supplier.createMany({
        data: [
          {
            name: "Odisha Agro Spawn Lab",
            contactPerson: "Dr. K. Patnaik",
            phone: "9876543210",
            email: "spawn@agroodisha.com",
            materialsSupplied: "Master Grain Spawn (Oyster, Milky, Button)",
          },
          {
            name: "Khurda Straw & Biomass Suppliers",
            contactPerson: "Bikash Sahoo",
            phone: "9861234567",
            email: "straw@khurdabiomass.com",
            materialsSupplied: "Organic Paddy Straw, Wheat Bran, Lime/Gypsum",
          },
        ],
      });
      suppliers = await db.supplier.findMany({ orderBy: { name: "asc" } });
    }

    return suppliers;
  }

  /**
   * Create a new supplier
   */
  static async createSupplier(input: SupplierInput) {
    return await db.supplier.create({
      data: {
        name: input.name,
        contactPerson: input.contactPerson ?? null,
        phone: input.phone,
        email: input.email ? input.email : null,
        materialsSupplied: input.materialsSupplied,
        gstin: input.gstin ?? null,
      },
    });
  }

  /**
   * Record raw material purchase order and automatically increment inventory
   */
  static async createPurchase(input: PurchaseInput, actorId: string) {
    return await db.$transaction(async (tx) => {
      const count = await tx.purchase.count();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const purchaseNumber = `PO-${dateStr}-${String(count + 1).padStart(3, "0")}`;

      let subtotal = 0;
      const purchaseItemsData: Array<{
        materialName: string;
        quantity: Prisma.Decimal;
        unit: string;
        unitPrice: Prisma.Decimal;
        totalPrice: Prisma.Decimal;
      }> = [];

      for (const item of input.items) {
        const lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;
        subtotal += lineTotal;
        purchaseItemsData.push({
          materialName: item.materialName,
          quantity: new Prisma.Decimal(item.quantity),
          unit: item.unit,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          totalPrice: new Prisma.Decimal(lineTotal),
        });
      }

      const purchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId: input.supplierId,
          purchaseDate: new Date(input.purchaseDate),
          subtotal: new Prisma.Decimal(subtotal),
          totalAmount: new Prisma.Decimal(subtotal),
          paymentStatus: input.paymentStatus,
          items: {
            create: purchaseItemsData,
          },
        },
      });

      // Update or create raw material inventory items and log PURCHASE transaction
      for (const item of input.items) {
        let invItem = await tx.inventoryItem.findFirst({
          where: { itemName: item.materialName },
        });

        if (!invItem) {
          invItem = await tx.inventoryItem.create({
            data: {
              itemName: item.materialName,
              itemCategory: ItemCategory.RAW_MATERIAL,
              unit: item.unit,
              availableStock: new Prisma.Decimal(item.quantity),
            },
          });
        } else {
          invItem = await tx.inventoryItem.update({
            where: { id: invItem.id },
            data: { availableStock: { increment: item.quantity } },
          });
        }

        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: invItem.id,
            transactionType: InventoryTxType.PURCHASE,
            quantity: new Prisma.Decimal(item.quantity),
            balanceAfter: invItem.availableStock,
            referenceType: "PURCHASE",
            referenceId: purchase.id,
            reason: `Purchased via ${purchaseNumber} from supplier`,
            performedBy: actorId,
          },
        });
      }

      await AuditService.logEvent(
        {
          actorId,
          action: "PURCHASE_CREATED",
          entityType: "PURCHASE",
          entityId: purchase.id,
          newState: { purchaseNumber, totalAmount: subtotal, itemsCount: input.items.length },
        },
        tx,
      );

      return purchase;
    });
  }

  /**
   * List purchase orders
   */
  static async listPurchases(limit = 25) {
    return await db.purchase.findMany({
      take: limit,
      include: {
        supplier: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: { purchaseDate: "desc" },
    });
  }

  /**
   * Record operational expense
   */
  static async recordExpense(input: ExpenseInput, actorId: string) {
    const expense = await db.expense.create({
      data: {
        category: input.category,
        amount: new Prisma.Decimal(input.amount),
        description: input.description,
        expenseDate: new Date(input.expenseDate),
        paymentMethod: input.paymentMethod,
        receiptUrl: input.receiptUrl ?? null,
        recordedBy: actorId,
      },
    });

    await AuditService.logEvent({
      actorId,
      action: "EXPENSE_RECORDED",
      entityType: "EXPENSE",
      entityId: expense.id,
      newState: { category: expense.category, amount: input.amount, description: input.description },
    });

    return expense;
  }

  /**
   * List expenses with optional category filter
   */
  static async listExpenses(category?: ExpenseCategory, limit = 50) {
    const where: Prisma.ExpenseWhereInput = category ? { category } : {};

    return await db.expense.findMany({
      where,
      include: {
        recorder: { select: { name: true } },
      },
      orderBy: { expenseDate: "desc" },
      take: limit,
    });
  }

  /**
   * Real-Time Executive Profit & Loss (P&L) Command Center
   * Calculates Revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses, and Net Profit!
   */
  static async getProfitAndLoss(period: "today" | "week" | "month" | "all" = "all") {
    let dateFilter: Date | undefined;
    const now = new Date();

    if (period === "today") {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Sales Revenue (From active / confirmed orders)
    const orderWhere: Prisma.OrderWhereInput = {
      orderStatus: { notIn: ["CANCELLED", "REFUNDED"] },
    };
    if (dateFilter) {
      orderWhere.createdAt = { gte: dateFilter };
    }

    const orders = await db.order.findMany({
      where: orderWhere,
      select: {
        totalAmount: true,
        subtotal: true,
        deliveryFee: true,
        items: {
          select: { quantity: true },
        },
      },
    });

    const salesRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalMushroomsSoldKg = orders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + Number(i.quantity), 0),
      0,
    );

    // 2. Cost of Goods Sold (Purchases of Raw Materials, Spawn, Straw)
    const purchaseWhere: Prisma.PurchaseWhereInput = {};
    if (dateFilter) {
      purchaseWhere.purchaseDate = { gte: dateFilter };
    }

    const purchases = await db.purchase.findMany({
      where: purchaseWhere,
      select: { totalAmount: true },
    });

    const cogs = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);

    // 3. Gross Profit
    const grossProfit = salesRevenue - cogs;
    const grossMarginPercent = salesRevenue > 0 ? (grossProfit / salesRevenue) * 100 : 0;

    // 4. Operating Expenses (Electricity, Labor, Fuel, Rent, etc.)
    const expenseWhere: Prisma.ExpenseWhereInput = {};
    if (dateFilter) {
      expenseWhere.expenseDate = { gte: dateFilter };
    }

    const expenses = await db.expense.findMany({
      where: expenseWhere,
      select: { category: true, amount: true },
    });

    const totalOperatingExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const expensesByCategory = expenses.reduce((acc, e) => {
      const cat = e.category;
      acc[cat] = (acc[cat] ?? 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    // 5. Net Profit
    const netProfit = grossProfit - totalOperatingExpenses;
    const netMarginPercent = salesRevenue > 0 ? (netProfit / salesRevenue) * 100 : 0;

    // 6. Production Yield stats for cost-per-kg calculation
    const batchWhere: Prisma.ProductionBatchWhereInput = {};
    if (dateFilter) {
      batchWhere.createdAt = { gte: dateFilter };
    }
    const batches = await db.productionBatch.findMany({
      where: batchWhere,
      select: { totalHarvestedKg: true },
    });

    const totalHarvestedKg = batches.reduce((sum, b) => sum + Number(b.totalHarvestedKg), 0);
    const totalCost = cogs + totalOperatingExpenses;
    const costPerKgProduced = totalHarvestedKg > 0 ? totalCost / totalHarvestedKg : 0;

    return {
      period,
      salesRevenue,
      totalOrdersCount: orders.length,
      totalMushroomsSoldKg,
      cogs,
      grossProfit,
      grossMarginPercent,
      totalOperatingExpenses,
      expensesByCategory,
      netProfit,
      netMarginPercent,
      totalHarvestedKg,
      costPerKgProduced,
    };
  }
}
