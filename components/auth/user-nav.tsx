import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { UserProfileMenu } from "./user-profile-menu";

/** Header user navigation container with dynamic role badge and profile dropdown. */
export async function UserNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="font-body text-xs font-semibold text-forest-primary underline-offset-4 hover:underline px-2 py-1"
        >
          Sign in
        </Link>
        <Link
          href="/products"
          className="hidden rounded-full bg-forest-primary px-4 py-2 font-display text-xs font-semibold text-spore-ivory hover:bg-forest-hover sm:inline-block transition-colors"
        >
          Shop now
        </Link>
      </div>
    );
  }

  return (
    <UserProfileMenu
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        isStaff: user.isStaff,
        isFounder: user.isFounder,
      }}
    />
  );
}
