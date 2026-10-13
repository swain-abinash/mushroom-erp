import type { NextAuthConfig } from "next-auth";

// Database-free Auth.js config shared by `proxy.ts` and `auth.ts`. Keep Prisma and bcrypt out of
// this file so the proxy stays a thin JWT check (see Next.js proxy guidance).
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.roles = user.roles;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.roles = token.roles ?? [];
      return session;
    },
  },
} satisfies NextAuthConfig;
