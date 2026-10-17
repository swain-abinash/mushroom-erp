"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { ProductionService } from "@/services/production.service";
import {
  createBatchSchema,
  logHarvestSchema,
  createRoomSchema,
} from "@/lib/validations/production";
import { BatchStatus, BedStatus } from "@prisma/client";

export async function createBatchAction(formData: FormData) {
  const user = await requirePermission(
    PERMISSIONS.PRODUCTION_BATCH_CREATE,
    "/admin/production/batches",
  );

  const raw = {
    mushroomType: formData.get("mushroomType") || "Oyster Mushroom",
    roomId: formData.get("roomId"),
    spawnSupplierId: formData.get("spawnSupplierId") || undefined,
    spawnQuantityKg: parseFloat(String(formData.get("spawnQuantityKg") || "0")),
    substrateType: formData.get("substrateType") || "Paddy Straw + Wheat Bran",
    substrateDryWeightKg: parseFloat(String(formData.get("substrateDryWeightKg") || "0")),
    numberOfBeds: parseInt(String(formData.get("numberOfBeds") || "0"), 10),
    inoculationDate: formData.get("inoculationDate"),
    expectedHarvestDays: parseInt(String(formData.get("expectedHarvestDays") || "21"), 10),
  };

  const parsed = createBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Please check batch inputs: room, spawn quantity, substrate weight, and bed count are required.",
    };
  }

  try {
    await ProductionService.createBatch(parsed.data, user.id);
    revalidatePath("/admin/production/batches");
    revalidatePath("/admin/production/rooms");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create cultivation batch.",
    };
  }
}

export async function updateBatchStatusAction(formData: FormData) {
  const user = await requirePermission(
    PERMISSIONS.PRODUCTION_BATCH_UPDATE,
    "/admin/production/batches",
  );

  const batchId = String(formData.get("batchId"));
  const status = String(formData.get("status")) as BatchStatus;

  try {
    await ProductionService.updateBatchStatus(batchId, status, user.id);
    revalidatePath("/admin/production/batches");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update batch status.",
    };
  }
}

export async function logHarvestAction(formData: FormData) {
  const user = await requirePermission(
    PERMISSIONS.HARVEST_LOG_ENTRY,
    "/admin/production/harvests",
  );

  const raw = {
    batchId: formData.get("batchId"),
    harvestDate: formData.get("harvestDate") || new Date().toISOString().slice(0, 10),
    flushNumber: parseInt(String(formData.get("flushNumber") || "1"), 10),
    totalWeightKg: parseFloat(String(formData.get("totalWeightKg") || "0")),
    gradeAKg: parseFloat(String(formData.get("gradeAKg") || "0")),
    gradeBKg: parseFloat(String(formData.get("gradeBKg") || "0")),
    gradeCDryKg: parseFloat(String(formData.get("gradeCDryKg") || "0")),
    wastageKg: parseFloat(String(formData.get("wastageKg") || "0")),
    notes: formData.get("notes") || undefined,
  };

  const parsed = logHarvestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid harvest data. Batch and total yield are required.",
    };
  }

  try {
    await ProductionService.logHarvest(parsed.data, user.id);
    revalidateTag("catalog", "max");
    revalidatePath("/admin/production/harvests");
    revalidatePath("/admin/production/batches");
    revalidatePath("/admin/inventory");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to log harvest.",
    };
  }
}

export async function updateBedStatusAction(formData: FormData) {
  await requirePermission(
    PERMISSIONS.PRODUCTION_BEDS_MANAGE,
    "/admin/production/rooms",
  );

  const bedId = String(formData.get("bedId"));
  const status = String(formData.get("status")) as BedStatus;
  const contaminationType = formData.get("contaminationType")
    ? String(formData.get("contaminationType"))
    : undefined;

  try {
    await ProductionService.updateBedStatus(bedId, status, contaminationType);
    revalidatePath("/admin/production/rooms");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update bed status.",
    };
  }
}

export async function createRoomAction(formData: FormData) {
  await requirePermission(
    PERMISSIONS.PRODUCTION_BEDS_MANAGE,
    "/admin/production/rooms",
  );

  const raw = {
    name: formData.get("name"),
    roomType: formData.get("roomType"),
    capacityBeds: parseInt(String(formData.get("capacityBeds") || "200"), 10),
    targetTempC: parseFloat(String(formData.get("targetTempC") || "24")),
    targetHumidity: parseFloat(String(formData.get("targetHumidity") || "85")),
  };

  const parsed = createRoomSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid room parameters." };
  }

  try {
    await ProductionService.createRoom(parsed.data);
    revalidatePath("/admin/production/rooms");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create growing room.",
    };
  }
}
