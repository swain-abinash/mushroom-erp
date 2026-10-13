import { z } from "zod";
import { STAFF_ROLES } from "@/lib/auth/permissions";

const email = z.email("Enter a valid email address.").trim().toLowerCase().max(150);

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[A-Za-z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");

const optionalPhone = z
  .string()
  .trim()
  .max(20)
  .regex(/^\+?[0-9 -]{7,20}$/, "Enter a valid phone number.")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || undefined);

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    email,
    phone: optionalPhone,
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: optionalPhone,
  companyName: optionalText(150),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[0-9]{2}[A-Z0-9]{13}$/, "GSTIN must be 15 characters.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const staffRole = z.enum(STAFF_ROLES as [string, ...string[]]);

export const inviteEmployeeSchema = z.object({
  name: z.string().trim().min(2, "Enter the employee's full name.").max(100),
  email,
  phone: optionalPhone,
  designation: z.string().trim().min(2, "Enter a designation.").max(80),
  department: z.string().trim().min(2, "Enter a department.").max(60),
  joiningDate: z.coerce.date({ error: "Enter a joining date." }),
  roles: z.array(staffRole).min(1, "Assign at least one role."),
});

export const assignRolesSchema = z.object({
  userId: z.uuid(),
  roles: z.array(staffRole).min(1, "Assign at least one role."),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type InviteEmployeeInput = z.infer<typeof inviteEmployeeSchema>;
