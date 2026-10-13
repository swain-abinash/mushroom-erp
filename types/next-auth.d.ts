import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    roles: string[];
  }

  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    roles: string[];
  }
}
