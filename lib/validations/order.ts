import { z } from "zod";
import { AddressType, OrderStatus, PaymentMethod } from "@prisma/client";

export const deliveryAddressSchema = z.object({
  recipientName: z.string().trim().min(2, "Recipient name must be at least 2 characters").max(100),
  recipientPhone: z
    .string()
    .trim()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number too long"),
  addressLine1: z.string().trim().min(5, "Address line 1 must be at least 5 characters").max(255),
  addressLine2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(2, "City is required").max(80),
  state: z.string().trim().min(2, "State is required").max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  addressType: z.nativeEnum(AddressType).default(AddressType.HOME),
  isDefault: z.boolean().default(false),
});

export type DeliveryAddressInput = z.infer<typeof deliveryAddressSchema>;

export const checkoutItemSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().positive("Quantity must be greater than zero"),
});

export const checkoutSchema = z.object({
  customer: z
    .object({
      name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
      email: z.string().trim().email("Please enter a valid email address"),
      phone: z
        .string()
        .trim()
        .min(10, "Phone number must be at least 10 digits")
        .max(15, "Phone number too long"),
    })
    .optional(),
  items: z.array(checkoutItemSchema).min(1, "Cart cannot be empty"),
  addressId: z.string().uuid().optional(),
  newAddress: deliveryAddressSchema.optional(),
  deliverySlot: z
    .enum(["MORNING_HARVEST_DISPATCH", "EVENING_DISPATCH"])
    .default("MORNING_HARVEST_DISPATCH"),
  paymentMethod: z
    .nativeEnum(PaymentMethod)
    .default(PaymentMethod.CASH_ON_DELIVERY),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const updateOrderStatusSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  status: z.nativeEnum(OrderStatus),
  notes: z.string().max(255).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
