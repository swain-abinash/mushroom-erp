import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ServiceError } from "@/lib/errors";
import { sendMail } from "@/lib/mail";
import { inviteEmail } from "@/lib/mail-templates";
import { appUrl } from "@/lib/url";
import { generateToken, hashPassword } from "@/lib/auth/password";
import { isStaff, ROLE_DEFINITIONS, ROLES, STAFF_ROLES, type RoleName } from "@/lib/auth/permissions";
import { AuditService } from "@/services/audit.service";
import { createPasswordToken, INVITE_TOKEN_TTL_MS } from "@/services/auth.service";
import type { InviteEmployeeInput } from "@/lib/validations/auth";

export async function listEmployees() {
  const users = await db.user.findMany({
    where: { userRoles: { some: { role: { name: { in: [...STAFF_ROLES] } } } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      employee: { select: { designation: true, department: true, joiningDate: true } },
      userRoles: { select: { role: { select: { name: true } } } },
    },
  });
  return users.map(({ userRoles, ...user }) => ({
    ...user,
    roles: userRoles.map(({ role }) => role.name),
  }));
}

export async function listStaffRoles() {
  return db.role.findMany({
    where: { name: { in: [...STAFF_ROLES] } },
    select: { name: true, displayName: true },
  });
}

/**
 * Creates the staff account with an unusable random password and returns a set-password link,
 * which is also emailed to the employee.
 */
export async function inviteEmployee(actorId: string, input: InviteEmployeeInput) {
  // The random password is never revealed; the employee sets their own via the invite link.
  const passwordHash = await hashPassword(generateToken().token);

  try {
    const { user, token } = await db.$transaction(async (tx) => {
      const roles = await tx.role.findMany({
        where: { name: { in: input.roles } },
        select: { id: true },
      });
      const user = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone ?? null,
          passwordHash,
          employee: {
            create: {
              designation: input.designation,
              department: input.department,
              joiningDate: input.joiningDate,
            },
          },
          userRoles: { create: roles.map((role) => ({ roleId: role.id })) },
        },
        select: { id: true, name: true, email: true },
      });
      const token = await createPasswordToken(user.id, INVITE_TOKEN_TTL_MS, tx);
      await AuditService.logEvent(
        {
          actorId,
          action: "EMPLOYEE_INVITED",
          entityType: "User",
          entityId: user.id,
          newState: { email: user.email, roles: input.roles },
        },
        tx,
      );
      return { user, token };
    });

    const inviteUrl = appUrl(`/reset-password?token=${token}&invite=1`);
    await sendMail({
      to: user.email,
      ...inviteEmail({
        name: user.name,
        email: user.email,
        roleLabels: input.roles.map(
          (role) => ROLE_DEFINITIONS[role as RoleName]?.displayName ?? role,
        ),
        inviteUrl,
        loginUrl: appUrl("/login"),
      }),
    });
    return { user, inviteUrl };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const field = String(error.meta?.target ?? "").includes("phone") ? "phone" : "email";
      throw new ServiceError(
        field === "phone" ? "PHONE_TAKEN" : "EMAIL_TAKEN",
        `An account with this ${field} already exists.`,
        409,
        field,
      );
    }
    throw error;
  }
}

async function getStaffRoleNames(userId: string): Promise<string[]> {
  const userRoles = await db.userRole.findMany({
    where: { userId },
    select: { role: { select: { name: true } } },
  });
  return userRoles.map(({ role }) => role.name);
}

/** Replaces the user's staff roles. Non-staff roles (e.g. CUSTOMER) are left untouched. */
export async function assignRoles(actorId: string, userId: string, roles: string[]) {
  const previous = await getStaffRoleNames(userId);
  if (
    actorId === userId &&
    previous.includes(ROLES.FOUNDER_ADMIN) &&
    !roles.includes(ROLES.FOUNDER_ADMIN)
  ) {
    throw new ServiceError("SELF_DEMOTION", "You can't remove your own Founder Admin role.");
  }

  await db.$transaction(async (tx) => {
    const staffRoles = await tx.role.findMany({
      where: { name: { in: [...STAFF_ROLES] } },
      select: { id: true, name: true },
    });
    await tx.userRole.deleteMany({
      where: { userId, roleId: { in: staffRoles.map((role) => role.id) } },
    });
    await tx.userRole.createMany({
      data: staffRoles
        .filter((role) => roles.includes(role.name))
        .map((role) => ({ userId, roleId: role.id })),
    });
    await AuditService.logEvent(
      {
        actorId,
        action: "ROLES_ASSIGNED",
        entityType: "User",
        entityId: userId,
        oldState: { roles: previous.filter((role) => isStaff([role])) },
        newState: { roles },
      },
      tx,
    );
  });
}

export async function setEmployeeActive(actorId: string, userId: string, isActive: boolean) {
  if (actorId === userId && !isActive) {
    throw new ServiceError("SELF_DEACTIVATION", "You can't deactivate your own account.");
  }

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: userId }, data: { isActive } });
    await tx.employee.updateMany({ where: { userId }, data: { isActive } });
    await AuditService.logEvent(
      {
        actorId,
        action: isActive ? "EMPLOYEE_REACTIVATED" : "EMPLOYEE_DEACTIVATED",
        entityType: "User",
        entityId: userId,
        oldState: { isActive: !isActive },
        newState: { isActive },
      },
      tx,
    );
  });
}
