"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireStaff } from "@/lib/auth/dal";
import { db } from "@/lib/db";
import { AuditService } from "@/services/audit.service";

export async function updateBusinessSettingsAction(formData: FormData) {
  const user = await requireStaff("/admin/settings");
  if (!user.isFounder) {
    return { success: false, error: "Only founder administrators can modify business settings." };
  }

  const keys = [
    "store_name",
    "contact_phone",
    "contact_whatsapp",
    "contact_email",
    "contact_address",
    "service_area",
  ];

  try {
    for (const key of keys) {
      const val = formData.get(key);
      if (val !== null) {
        await db.businessSetting.upsert({
          where: { key },
          update: { value: String(val).trim() },
          create: { key, value: String(val).trim() },
        });
      }
    }

    await AuditService.logEvent({
      actorId: user.id,
      action: "BUSINESS_SETTINGS_UPDATED",
      entityType: "SETTINGS",
      entityId: "GLOBAL",
      newState: { keysUpdated: keys },
    });

    revalidateTag("settings", "max");
    revalidatePath("/admin/settings");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update business settings.",
    };
  }
}
