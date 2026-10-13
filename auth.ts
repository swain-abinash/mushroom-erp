import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validations/auth";

// Compared against when the email is unknown so that response time doesn't reveal which emails exist.
const DUMMY_HASH = "$2b$12$QCqJgYPx4lg9H5rkKRpRYORjRzpp9eVEgOq6Tt58jcWdHGbTiKQ/G";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            isActive: true,
            userRoles: { select: { role: { select: { name: true } } } },
          },
        });

        const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid || !user.isActive) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.userRoles.map((userRole) => userRole.role.name),
        };
      },
    }),
  ],
});
