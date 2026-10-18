import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { formatDate } from "@/lib/utils";
import { getProfile } from "@/services/auth.service";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm, ProfileForm } from "./profile-forms";

export const instant = false;
export const metadata: Metadata = { title: "My account — SporeERP" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const profile = await getProfile(user.id);
  if (!profile) return null;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12 text-forest-primary">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">My account</h1>
            <span className="rounded-full bg-forest-primary/10 border border-forest-primary/20 px-3 py-0.5 text-xs font-bold text-forest-primary">
              {user.roles[0]?.replace(/_/g, " ") ?? "CUSTOMER"}
            </span>
          </div>
          <p className="mt-1 font-body text-sm text-forest-primary/70">
            Member since {formatDate(profile.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/account/orders"
            className="rounded-full bg-forest-primary px-6 py-3 font-display font-semibold text-spore-ivory hover:bg-forest-hover"
          >
            My Orders
          </Link>
          {user.isStaff ? (
            <Link
              href="/admin/dashboard"
              className="rounded-full border border-forest-primary px-6 py-3 font-display font-semibold"
            >
              Admin console
            </Link>
          ) : null}
          <form action={signOutAction}>
            <Button type="submit" variant="secondary">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <div className="rounded-2xl border border-forest-primary/10 bg-surface-white p-8">
        <h2 className="mb-6 font-display text-xl font-bold">Profile</h2>
        <ProfileForm profile={profile} />
      </div>

      <div className="rounded-2xl border border-forest-primary/10 bg-surface-white p-8">
        <h2 className="mb-6 font-display text-xl font-bold">Password</h2>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
