"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { serviceFailure, validationFailure, type FormState } from "@/lib/form-state";
import { stockNotificationSchema } from "@/lib/validations/catalog";
import { requestStockNotification } from "@/services/catalog.service";

export async function notifyMeAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = stockNotificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const user = await getCurrentUser();
  try {
    await requestStockNotification(parsed.data.productId, parsed.data.email, user?.id);
  } catch (error) {
    return serviceFailure(error);
  }
  return { success: "Thanks! We'll email you as soon as it's back in stock." };
}
