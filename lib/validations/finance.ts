import { z } from "zod";
import { ExpenseCategory, PaymentStatus } from "@prisma/client";

export const supplierSchema = z.object({
  name: z.string().trim().min(2, "Supplier name required").max(120),
  contactPerson: z.string().trim().max(100).optional(),
  phone: z.string().trim().min(10, "Phone number required").max(20),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  materialsSupplied: z
    .string()
    .trim()
    .min(2, "Materials supplied description required")
    .default("Paddy Straw, Wheat Bran, Grain Spawn"),
  gstin: z.string().max(15).optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

export const purchaseItemSchema = z.object({
  materialName: z.string().trim().min(2, "Material name required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().default("KG"),
  unitPrice: z.number().positive("Price must be positive"),
});

export const purchaseSchema = z.object({
  supplierId: z.string().uuid("Please select a supplier"),
  purchaseDate: z.string().min(10, "Purchase date required"),
  items: z.array(purchaseItemSchema).min(1, "At least one item required"),
  paymentStatus: z.nativeEnum(PaymentStatus).default(PaymentStatus.PAID),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;

export const expenseSchema = z.object({
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive("Amount must be greater than zero"),
  description: z.string().trim().min(3, "Description required").max(255),
  expenseDate: z.string().min(10, "Expense date required"),
  paymentMethod: z.string().trim().default("UPI"),
  receiptUrl: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
