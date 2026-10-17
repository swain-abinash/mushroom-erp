"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { FinanceService } from "@/services/finance.service";
import { supplierSchema, purchaseSchema } from "@/lib/validations/finance";
import { PaymentStatus } from "@prisma/client";

export async function createSupplierAction(formData: FormData) {
  await requirePermission(PERMISSIONS.SUPPLIERS_MANAGE, "/admin/purchases");

  const raw = {
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson") || undefined,
    phone: formData.get("phone"),
    email: formData.get("email") || undefined,
    materialsSupplied: formData.get("materialsSupplied") || "Paddy Straw, Spawn",
    gstin: formData.get("gstin") || undefined,
  };

  const parsed = supplierSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid supplier details." };
  }

  try {
    await FinanceService.createSupplier(parsed.data);
    revalidatePath("/admin/purchases");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create supplier.",
    };
  }
}

export async function createPurchaseAction(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.PURCHASES_CREATE, "/admin/purchases");

  const supplierId = String(formData.get("supplierId"));
  const purchaseDate = String(formData.get("purchaseDate") || new Date().toISOString().slice(0, 10));
  const materialName = String(formData.get("materialName"));
  const quantity = parseFloat(String(formData.get("quantity") || "0"));
  const unit = String(formData.get("unit") || "KG");
  const unitPrice = parseFloat(String(formData.get("unitPrice") || "0"));

  const raw = {
    supplierId,
    purchaseDate,
    paymentStatus: PaymentStatus.PAID,
    items: [{ materialName, quantity, unit, unitPrice }],
  };

  const parsed = purchaseSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid purchase details. Supplier, quantity, and price are required." };
  }

  try {
    await FinanceService.createPurchase(parsed.data, user.id);
    revalidatePath("/admin/purchases");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/reports/pnl");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record purchase.",
    };
  }
}
