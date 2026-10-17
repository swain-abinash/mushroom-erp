"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { InventoryService } from "@/services/inventory.service";
import {
  stockAdjustmentSchema,
  createInventoryItemSchema,
} from "@/lib/validations/inventory";

export async function adjustStockAction(formData: FormData) {
  const user = await requirePermission(
    PERMISSIONS.INVENTORY_ADJUST_STOCK,
    "/admin/inventory",
  );

  const raw = {
    inventoryItemId: formData.get("inventoryItemId"),
    transactionType: formData.get("transactionType"),
    quantity: parseFloat(String(formData.get("quantity") || "0")),
    reason: formData.get("reason"),
  };

  const parsed = stockAdjustmentSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid stock adjustment details. Please check quantity and reason.",
    };
  }

  try {
    await InventoryService.adjustStock(parsed.data, user.id);
    revalidateTag("catalog", "max");
    revalidatePath("/admin/inventory");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record stock adjustment.",
    };
  }
}

export async function createInventoryItemAction(formData: FormData) {
  const user = await requirePermission(
    PERMISSIONS.INVENTORY_ADJUST_STOCK,
    "/admin/inventory",
  );

  const raw = {
    itemName: formData.get("itemName"),
    itemCategory: formData.get("itemCategory"),
    unit: formData.get("unit") || "KG",
    openingStock: parseFloat(String(formData.get("openingStock") || "0")),
    reorderThreshold: parseFloat(String(formData.get("reorderThreshold") || "5")),
  };

  const parsed = createInventoryItemSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid item details.",
    };
  }

  try {
    await InventoryService.createItem(parsed.data, user.id);
    revalidatePath("/admin/inventory");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create inventory item.",
    };
  }
}
