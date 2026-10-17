"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { FinanceService } from "@/services/finance.service";
import { expenseSchema } from "@/lib/validations/finance";
import { ExpenseCategory } from "@prisma/client";

export async function recordExpenseAction(formData: FormData) {
  const user = await requirePermission(PERMISSIONS.EXPENSES_RECORD, "/admin/expenses");

  const raw = {
    category: formData.get("category") as ExpenseCategory,
    amount: parseFloat(String(formData.get("amount") || "0")),
    description: formData.get("description"),
    expenseDate: formData.get("expenseDate") || new Date().toISOString().slice(0, 10),
    paymentMethod: formData.get("paymentMethod") || "UPI",
    receiptUrl: formData.get("receiptUrl") || undefined,
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid expense category, amount, and description." };
  }

  try {
    await FinanceService.recordExpense(parsed.data, user.id);
    revalidatePath("/admin/expenses");
    revalidatePath("/admin/reports/pnl");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to record expense.",
    };
  }
}
