import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { appUrl, sendMail } from "@/lib/mail";
import { generateToken, hashPassword, hashToken, verifyPassword } from "@/lib/auth/password";
import { ROLES } from "@/lib/auth/permissions";
import type { RegisterInput } from "@/lib/validations/auth";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
export const INVITE_TOKEN_TTL_MS = 72 * 60 * 60 * 1000; // 72 hours

function isUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function uniqueViolationError(error: Prisma.PrismaClientKnownRequestError): ServiceError {
  const target = String(error.meta?.target ?? "");
  return target.includes("phone")
    ? new ServiceError(
        "PHONE_TAKEN",
        "An account with this phone number already exists.",
        409,
        "phone",
      )
    : new ServiceError("EMAIL_TAKEN", "An account with this email already exists.", 409, "email");
}

export async function registerCustomer(input: RegisterInput) {
  const passwordHash = await hashPassword(input.password);

  try {
    return await db.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        passwordHash,
        customer: { create: {} },
        userRoles: { create: { role: { connect: { name: ROLES.CUSTOMER } } } },
      },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw uniqueViolationError(error);
    throw error;
  }
}

/** Creates a single-use set-password token for the user and returns the raw token. */
export async function createPasswordToken(
  userId: string,
  ttlMs: number,
  tx: Prisma.TransactionClient = db,
): Promise<string> {
  const { token, tokenHash } = generateToken();
  await tx.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt: new Date(Date.now() + ttlMs) },
  });
  return token;
}

/** Always resolves without revealing whether the email is registered. */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isActive: true },
  });
  if (!user || !user.isActive) return;

  const token = await createPasswordToken(user.id, RESET_TOKEN_TTL_MS);
  await sendMail({
    to: user.email,
    subject: "Reset your SporeERP password",
    text: `Hi ${user.name},\n\nReset your password using this link (valid for 1 hour):\n${appUrl(
      `/reset-password?token=${token}`,
    )}\n\nIf you didn't request this, you can ignore this email.`,
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ServiceError(
      "INVALID_TOKEN",
      "This link is invalid or has expired. Request a new one.",
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.passwordResetToken.deleteMany({ where: { userId: record.userId, usedAt: null } }),
  ]);
}

export async function getProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      customer: { select: { customerType: true, companyName: true, gstin: true } },
    },
  });
}

export async function updateProfile(
  userId: string,
  input: { name: string; phone?: string; companyName?: string; gstin?: string },
): Promise<void> {
  // Staff accounts have no customer row, so the B2B fields only apply when one exists.
  const customer = await db.customer.findUnique({ where: { userId }, select: { id: true } });

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        phone: input.phone ?? null,
        customer: customer
          ? { update: { companyName: input.companyName ?? null, gstin: input.gstin ?? null } }
          : undefined,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw uniqueViolationError(error);
    throw error;
  }
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new ServiceError(
      "WRONG_PASSWORD",
      "Current password is incorrect.",
      400,
      "currentPassword",
    );
  }
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}
