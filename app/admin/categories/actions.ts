"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import {
  serviceFailure,
  submittedValues,
  validationFailure,
  type FormState,
} from "@/lib/form-state";
import { categoryFormSchema } from "@/lib/validations/catalog";
import { createCategory, updateCategory } from "@/services/catalog.service";

export async function saveCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission(PERMISSIONS.CATALOG_PRODUCT_MANAGE, "/admin/categories");
  const values = submittedValues(formData);
  const categoryId = String(formData.get("id") ?? "") || null;

  const parsed = categoryFormSchema.safeParse(values);
  if (!parsed.success) return { ...validationFailure(parsed.error), values };

  try {
    if (categoryId) await updateCategory(user.id, categoryId, parsed.data);
    else await createCategory(user.id, parsed.data);
  } catch (error) {
    return { ...serviceFailure(error), values };
  }

  updateTag(CATALOG_TAG);
  revalidatePath("/admin/categories");
  // A fresh create form is rendered after success, so no values are echoed back.
  return { success: categoryId ? "Category saved." : `Category "${parsed.data.name}" created.` };
}
