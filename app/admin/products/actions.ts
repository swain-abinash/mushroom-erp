"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { hasPermission, requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { CATALOG_TAG } from "@/lib/catalog/queries";
import {
  serviceFailure,
  submittedValues,
  validationFailure,
  type FormState,
} from "@/lib/form-state";
import { MAX_IMAGES_PER_UPLOAD } from "@/lib/storage";
import { productFormSchema } from "@/lib/validations/catalog";
import {
  archiveProduct,
  createProduct,
  productWriteFromForm,
  updateProduct,
} from "@/services/catalog.service";

function refreshCatalog() {
  updateTag(CATALOG_TAG);
  revalidatePath("/admin/products");
}

export async function saveProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requirePermission(PERMISSIONS.CATALOG_PRODUCT_MANAGE, "/admin/products");
  const values = submittedValues(formData);
  const productId = String(formData.get("id") ?? "") || null;

  const parsed = productFormSchema.safeParse(values);
  if (!parsed.success) return { ...validationFailure(parsed.error), values };

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    return {
      fieldErrors: { images: [`Upload at most ${MAX_IMAGES_PER_UPLOAD} images at a time.`] },
      values,
    };
  }

  const images = {
    newFiles: files,
    removeImageIds: formData.getAll("removeImageIds").map(String),
    primaryImage: parsed.data.primaryImage,
  };

  let savedId: string;
  try {
    const write = productWriteFromForm(parsed.data);
    const product = productId
      ? await updateProduct(user.id, productId, write, images, {
          canOverridePricing: hasPermission(user, PERMISSIONS.CATALOG_PRICING_OVERRIDE),
        })
      : await createProduct(user.id, write, images);
    savedId = product.id;
  } catch (error) {
    return { ...serviceFailure(error), values };
  }

  refreshCatalog();
  redirect(`/admin/products/${savedId}?saved=${productId ? "updated" : "created"}`);
}

export async function archiveProductAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requirePermission(PERMISSIONS.CATALOG_PRODUCT_MANAGE, "/admin/products");
  const productId = String(formData.get("id") ?? "");

  try {
    await archiveProduct(user.id, productId);
  } catch (error) {
    return serviceFailure(error);
  }
  refreshCatalog();
  redirect(`/admin/products/${productId}?saved=archived`);
}
