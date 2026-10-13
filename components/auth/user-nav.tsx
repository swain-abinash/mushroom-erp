import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";

/** Header sign-in state. Reads the session, so render it inside a <Suspense> boundary. */
export async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className="font-semibold underline-offset-4 hover:underline">
        Sign in
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-4">
      {user.isStaff ? (
        <Link href="/admin/dashboard" className="underline-offset-4 hover:underline">
          Admin
        </Link>
      ) : null}
      <Link href="/account" className="font-semibold underline-offset-4 hover:underline">
        {user.name.split(" ")[0]}
      </Link>
    </span>
  );
}
