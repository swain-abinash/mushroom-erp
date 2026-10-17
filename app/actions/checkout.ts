"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth/dal";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/order";
import { OrderService } from "@/services/order.service";
import { ServiceError } from "@/lib/errors";

export type CheckoutActionResult = {
  success: boolean;
  orderNumber?: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function placeOrderAction(input: CheckoutInput): Promise<CheckoutActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Please sign in to complete your order.",
    };
  }

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [key, issues] of Object.entries(parsed.error.flatten().fieldErrors)) {
      fieldErrors[key] = issues as string[];
    }
    return {
      success: false,
      error: "Please check your delivery address and order details.",
      fieldErrors,
    };
  }

  try {
    const result = await OrderService.createOrder(user.id, parsed.data, user.id);
    
    // Invalidate catalog cache so stock badges update immediately
    revalidateTag("catalog", "max");
    revalidatePath("/account/orders");
    revalidatePath("/products");
    revalidatePath("/");

    return {
      success: true,
      orderNumber: result.orderNumber,
    };
  } catch (error) {
    if (error instanceof ServiceError) {
      return {
        success: false,
        error: error.message,
      };
    }
    console.error("Order placement error:", error);
    return {
      success: false,
      error: "Failed to place order. Please try again or contact support.",
    };
  }
}
