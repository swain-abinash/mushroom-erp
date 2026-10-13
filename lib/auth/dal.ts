import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { isStaff, ROLES, type PermissionCode } from "@/lib/auth/permissions";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roles: string[];
  permissions: string[];
  isStaff: boolean;
  isFounder: boolean;
};

/**
 * Resolves the signed-in user from the database on every request (deduplicated per render).
 * The JWT only proves identity; roles, permissions and the active flag are always read fresh, so
 * role edits and deactivations take effect immediately.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // Mark this as request-time work before Auth.js runs: it calls crypto.getRandomValues() before
  // reading cookies, which Cache Components otherwise flags as an unstable value during prerender.
  await connection();
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      userRoles: {
        select: {
          role: {
            select: {
              name: true,
              rolePermissions: { select: { permission: { select: { code: true } } } },
            },
          },
        },
      },
    },
  });
  if (!user || !user.isActive) return null;

  const roles = user.userRoles.map(({ role }) => role.name);
  const permissions = [
    ...new Set(
      user.userRoles.flatMap(({ role }) =>
        role.rolePermissions.map(({ permission }) => permission.code),
      ),
    ),
  ];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles,
    permissions,
    isStaff: isStaff(roles),
    isFounder: roles.includes(ROLES.FOUNDER_ADMIN),
  };
});

export function hasPermission(user: CurrentUser, permission: PermissionCode): boolean {
  return user.permissions.includes(permission);
}

export async function requireUser(returnTo = "/account"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireStaff(returnTo = "/admin/dashboard"): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!user.isStaff) redirect("/unauthorized");
  return user;
}

export async function requirePermission(
  permission: PermissionCode,
  returnTo = "/admin/dashboard",
): Promise<CurrentUser> {
  const user = await requireStaff(returnTo);
  if (!hasPermission(user, permission)) redirect("/unauthorized");
  return user;
}
