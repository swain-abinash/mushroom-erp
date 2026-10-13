"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/dal";
import { isStaff } from "@/lib/auth/permissions";
import {
  safeCallbackUrl,
  serviceFailure,
  validationFailure,
  type FormState,
} from "@/lib/form-state";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import {
  changePassword,
  registerCustomer,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "@/services/auth.service";

async function signInWithCredentials(email: string, password: string): Promise<FormState | null> {
  try {
    await signIn("credentials", { email, password, redirect: false });
    return null;
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error;
  }
}

async function defaultLandingPage(email: string): Promise<string> {
  const userRoles = await db.userRole.findMany({
    where: { user: { email } },
    select: { role: { select: { name: true } } },
  });
  return isStaff(userRoles.map(({ role }) => role.name)) ? "/admin/dashboard" : "/account";
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const failure = await signInWithCredentials(parsed.data.email, parsed.data.password);
  if (failure) return failure;

  redirect(
    safeCallbackUrl(formData.get("callbackUrl")) ?? (await defaultLandingPage(parsed.data.email)),
  );
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await registerCustomer(parsed.data);
  } catch (error) {
    return serviceFailure(error);
  }

  const failure = await signInWithCredentials(parsed.data.email, parsed.data.password);
  if (failure) return failure;

  redirect(safeCallbackUrl(formData.get("callbackUrl")) ?? "/account");
}

export async function forgotPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  await requestPasswordReset(parsed.data.email);
  return {
    success:
      "If an account exists for this email, a reset link is on its way. It expires in 1 hour.",
  };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await resetPassword(parsed.data.token, parsed.data.password);
  } catch (error) {
    return serviceFailure(error);
  }
  redirect("/login?reset=1");
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await updateProfile(user.id, parsed.data);
  } catch (error) {
    return serviceFailure(error);
  }
  return { success: "Profile updated." };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  try {
    await changePassword(user.id, parsed.data.currentPassword, parsed.data.password);
  } catch (error) {
    return serviceFailure(error);
  }
  return { success: "Password changed." };
}

export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
