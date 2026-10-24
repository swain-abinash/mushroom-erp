"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { requireDeliveryAccess } from "@/lib/auth/dal";
import { hasPermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { serviceFailure, validationFailure, type FormState } from "@/lib/form-state";
import { assignDeliveryAgent, collectOrder, markDelivered } from "@/services/delivery.service";

const assignSchema = z.object({
  orderId: z.string().uuid(),
  driverId: z.string().uuid("Choose a delivery agent."),
});

const orderIdSchema = z.object({
  orderId: z.string().uuid(),
  notes: z.string().trim().max(255).optional(),
});

function refresh(orderId: string) {
  revalidateTag("catalog", "max");
  revalidatePath("/admin/deliveries");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/inventory");
}

export async function assignAgentAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireDeliveryAccess();
  if (!hasPermission(user, PERMISSIONS.DELIVERIES_ASSIGN)) return { error: "You cannot assign deliveries." };

  const parsed = assignSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await assignDeliveryAgent(user.id, parsed.data.orderId, parsed.data.driverId);
    refresh(parsed.data.orderId);
    return { success: "Assigned." };
  } catch (error) {
    return serviceFailure(error);
  }
}

export async function collectOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireDeliveryAccess();
  if (!hasPermission(user, PERMISSIONS.DELIVERIES_UPDATE_OWN)) return { error: "You cannot update deliveries." };

  const parsed = orderIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await collectOrder(user.id, parsed.data.orderId);
    refresh(parsed.data.orderId);
    return { success: "Collected. Stock is now with you." };
  } catch (error) {
    return serviceFailure(error);
  }
}

export async function markDeliveredAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireDeliveryAccess();
  if (!hasPermission(user, PERMISSIONS.DELIVERIES_UPDATE_OWN)) return { error: "You cannot update deliveries." };

  const parsed = orderIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await markDelivered(user.id, parsed.data.orderId, parsed.data.notes);
    refresh(parsed.data.orderId);
    return { success: "Marked as delivered." };
  } catch (error) {
    return serviceFailure(error);
  }
}
