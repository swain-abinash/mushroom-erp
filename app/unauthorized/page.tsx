import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Access denied — SporeERP" };

export default function UnauthorizedPage() {
  return (
    <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center text-forest-primary">
      <h1 className="font-display text-3xl font-bold">Access denied</h1>
      <p className="font-body text-forest-primary/70">
        Your account doesn&apos;t have permission to view that page. If you think this is a mistake,
        ask a founder admin to check your role.
      </p>
      <div className="flex gap-4 font-body text-sm font-semibold">
        <Link href="/" className="underline-offset-4 hover:underline">
          Go to storefront
        </Link>
        <Link href="/account" className="underline-offset-4 hover:underline">
          My account
        </Link>
      </div>
    </main>
  );
}
