import "server-only";
import { Prisma, ItemCategory, InventoryTxType } from "@prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { AuditService } from "@/services/audit.service";
import type { StockAdjustmentInput, CreateInventoryItemInput } from "@/lib/validations/inventory";

export class InventoryService {
  /**
   * List all inventory stock items with low stock warning calculation
   */
  static async listInventory(category?: ItemCategory) {
    const where: Prisma.InventoryItemWhereInput = category ? { itemCategory: category } : {};

    const items = await db.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true,
            variety: true,
            status: true,
          },
        },
      },
      orderBy: [{ itemCategory: "asc" }, { itemName: "asc" }],
    });

    return items.map((item) => {
      const available = Number(item.availableStock);
      const reserved = Number(item.reservedStock);
      const sellable = Math.max(0, available - reserved);
      const threshold = Number(item.reorderThreshold);
      const isLowStock = available <= threshold;

      return {
        id: item.id,
        productId: item.productId,
        itemName: item.itemName,
        itemCategory: item.itemCategory,
        unit: item.unit,
        updatedAt: item.updatedAt,
        product: item.product,
        availableStock: available,
        reservedStock: reserved,
        reorderThreshold: threshold,
        availableStockNum: available,
        reservedStockNum: reserved,
        sellableStockNum: sellable,
        reorderThresholdNum: threshold,
        isLowStock,
      };
    });
  }

  /**
   * Record transactional stock adjustment (spoilage, count correction, manual adjustment)
   */
  static async adjustStock(input: StockAdjustmentInput, actorId: string) {
    return await db.$transaction(async (tx) => {
      const item = await tx.inventoryItem.findUnique({
        where: { id: input.inventoryItemId },
      });

      if (!item) {
        throw new ServiceError("NOT_FOUND", "Inventory item not found", 404);
      }

      const currentStock = Number(item.availableStock);
      const adjustmentQty = input.quantity;
      const newStock = currentStock + adjustmentQty;

      if (newStock < 0) {
        throw new ServiceError(
          "INVALID_QUANTITY",
          `Cannot reduce stock below zero. Current stock: ${currentStock} ${item.unit}.`,
          400,
        );
      }

      const updated = await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          availableStock: new Prisma.Decimal(newStock),
        },
      });

      const transaction = await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: item.id,
          transactionType: input.transactionType,
          quantity: new Prisma.Decimal(adjustmentQty),
          balanceAfter: updated.availableStock,
          reason: input.reason,
          performedBy: actorId,
        },
      });

      await AuditService.logEvent(
        {
          actorId,
          action: "INVENTORY_ADJUSTED",
          entityType: "INVENTORY_ITEM",
          entityId: item.id,
          oldState: { availableStock: currentStock },
          newState: { availableStock: newStock, reason: input.reason, type: input.transactionType },
        },
        tx,
      );

      return transaction;
    });
  }

  /**
   * Create non-product inventory item (e.g. Spawn, Substrate, Packaging bags)
   */
  static async createItem(input: CreateInventoryItemInput, actorId: string) {
    return await db.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          itemName: input.itemName,
          itemCategory: input.itemCategory,
          unit: input.unit,
          availableStock: new Prisma.Decimal(input.openingStock),
          reorderThreshold: new Prisma.Decimal(input.reorderThreshold),
        },
      });

      if (input.openingStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            inventoryItemId: item.id,
            transactionType: InventoryTxType.MANUAL_ADJUSTMENT,
            quantity: new Prisma.Decimal(input.openingStock),
            balanceAfter: item.availableStock,
            reason: "Initial opening stock entry",
            performedBy: actorId,
          },
        });
      }

      await AuditService.logEvent(
        {
          actorId,
          action: "INVENTORY_ITEM_CREATED",
          entityType: "INVENTORY_ITEM",
          entityId: item.id,
          newState: { itemName: item.itemName, category: item.itemCategory, openingStock: input.openingStock },
        },
        tx,
      );

      return item;
    });
  }

  /**
   * List recent inventory ledger transactions
   */
  static async listTransactions(limit = 30) {
    return await db.inventoryTransaction.findMany({
      take: limit,
      include: {
        inventoryItem: {
          select: { itemName: true, unit: true, itemCategory: true },
        },
        actor: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
