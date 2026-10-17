import { z } from "zod";
import { ItemCategory, InventoryTxType } from "@prisma/client";

export const stockAdjustmentSchema = z.object({
  inventoryItemId: z.string().uuid("Invalid inventory item ID"),
  transactionType: z.nativeEnum(InventoryTxType),
  quantity: z.number().refine((val) => val !== 0, "Quantity cannot be zero"),
  reason: z.string().trim().min(3, "Reason must be at least 3 characters").max(255),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const createInventoryItemSchema = z.object({
  itemName: z.string().trim().min(2, "Item name must be at least 2 characters").max(100),
  itemCategory: z.nativeEnum(ItemCategory),
  unit: z.string().trim().default("KG"),
  openingStock: z.number().min(0, "Opening stock cannot be negative").default(0),
  reorderThreshold: z.number().min(0, "Threshold cannot be negative").default(5),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
