"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth/dal";
import { db } from "@/lib/db";
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
    const sessionUser = await getCurrentUser();
    let customerUserId = sessionUser?.id;

    if (!customerUserId) {
      const email =
        parsed.data.customer?.email?.trim().toLowerCase() ||
        `guest_${Date.now()}@sporeerp.local`;
      const name =
        parsed.data.customer?.name?.trim() ||
        parsed.data.newAddress?.recipientName?.trim() ||
        "Valued Customer";
      const phone =
        parsed.data.customer?.phone?.trim() ||
        parsed.data.newAddress?.recipientPhone?.trim() ||
        null;

      let existingUser = await db.user.findUnique({
        where: { email },
        include: { customer: true },
      });

      if (!existingUser) {
        const dummyHash = await bcrypt.hash(`Guest@${Date.now()}`, 10);
        existingUser = await db.user.create({
          data: {
            name,
            email,
            phone,
            passwordHash: dummyHash,
            customer: {
              create: {
                customerType: "RETAIL",
              },
            },
          },
          include: { customer: true },
        });
      } else if (!existingUser.customer) {
        await db.customer.create({
          data: {
            userId: existingUser.id,
            customerType: "RETAIL",
          },
        });
      }
      customerUserId = existingUser.id;
    }

    const result = await OrderService.createOrder(customerUserId, parsed.data, customerUserId);
    
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
