"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { OrderService } from "@/services/order.service";
import { updateOrderStatusSchema } from "@/lib/validations/order";
import { OrderStatus } from "@prisma/client";

export async function updateOrderStatusAction(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.ORDERS_UPDATE_STATUS, "/admin/orders");

  const raw = {
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    notes: formData.get("notes") || undefined,
  };

  const parsed = updateOrderStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: "Invalid status update data.",
    };
  }

  try {
    await OrderService.updateOrderStatus(
      parsed.data.orderId,
      parsed.data.status,
      parsed.data.notes,
      user.id,
    );

    revalidateTag("catalog", "max");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${parsed.data.orderId}`);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update order status.",
    };
  }
}
