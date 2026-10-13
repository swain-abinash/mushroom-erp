"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { serviceFailure, validationFailure, type FormState } from "@/lib/form-state";
import { assignRolesSchema, inviteEmployeeSchema } from "@/lib/validations/auth";
import { assignRoles, inviteEmployee, setEmployeeActive } from "@/services/employee.service";

export async function inviteEmployeeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requirePermission(PERMISSIONS.USERS_MANAGE_ROLES, "/admin/employees");
  const parsed = inviteEmployeeSchema.safeParse({
    ...Object.fromEntries(formData),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    const { user, inviteUrl } = await inviteEmployee(actor.id, parsed.data);
    revalidatePath("/admin/employees");
    return {
      success: `${user.name} has been invited. Share the set-password link below if the email doesn't arrive.`,
      data: { inviteUrl },
    };
  } catch (error) {
    return serviceFailure(error);
  }
}

export async function assignRolesAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const actor = await requirePermission(PERMISSIONS.USERS_MANAGE_ROLES, "/admin/employees");
  const parsed = assignRolesSchema.safeParse({
    userId: formData.get("userId"),
    roles: formData.getAll("roles"),
  });
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await assignRoles(actor.id, parsed.data.userId, parsed.data.roles);
  } catch (error) {
    return serviceFailure(error);
  }
  revalidatePath("/admin/employees");
  return { success: "Roles updated." };
}

export async function setEmployeeActiveAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const actor = await requirePermission(PERMISSIONS.USERS_MANAGE_ROLES, "/admin/employees");
  const userId = String(formData.get("userId") ?? "");
  const isActive = formData.get("isActive") === "true";

  try {
    await setEmployeeActive(actor.id, userId, isActive);
  } catch (error) {
    return serviceFailure(error);
  }
  revalidatePath("/admin/employees");
  return { success: isActive ? "Account reactivated." : "Account deactivated." };
}
