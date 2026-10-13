import "server-only";
import { apiError } from "@/lib/api-response";
import { getCurrentUser, hasPermission, type CurrentUser } from "@/lib/auth/dal";
import type { PermissionCode } from "@/lib/auth/permissions";

/**
 * Permission check for JSON route handlers. Unlike the DAL's `require*` helpers it never redirects;
 * it returns a 401/403 error envelope for the caller to send back.
 */
export async function authorizeApi(
  permission: PermissionCode,
): Promise<{ user: CurrentUser; error?: never } | { user?: never; error: Response }> {
  const user = await getCurrentUser();
  if (!user) {
    return { error: apiError("UNAUTHENTICATED", "Sign in to access this resource.", 401) };
  }
  if (!hasPermission(user, permission)) {
    return {
      error: apiError("FORBIDDEN", `This action requires the ${permission} permission.`, 403),
    };
  }
  return { user };
}
