import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { isStaff, ROLES } from "@/lib/auth/permissions";

// Optimistic route guard based on the signed JWT (no database access). Pages and server actions
// re-check roles and permissions against the database via `lib/auth/dal.ts`.
const { auth } = NextAuth(authConfig);

const FOUNDER_ONLY_PREFIXES = ["/admin/reports", "/admin/settings"];

export const proxy = auth((req) => {
  const { pathname, search } = req.nextUrl;
  const roles = req.auth?.user?.roles ?? [];

  if (!req.auth?.user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Sign in to access this resource." },
        },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    if (!isStaff(roles)) {
      return NextResponse.redirect(new URL("/unauthorized", req.nextUrl));
    }
    const founderOnly = FOUNDER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (founderOnly && !roles.includes(ROLES.FOUNDER_ADMIN)) {
      return NextResponse.redirect(new URL("/admin/dashboard?error=restricted", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/api/v1/:path*"],
};
