import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/forms/auth-card";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set password — SporeERP" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; invite?: string }>;
}) {
  const { token, invite } = await searchParams;

  if (!token) {
    return (
      <AuthCard title="Link missing" subtitle="This page needs a valid reset link.">
        <Link
          href="/forgot-password"
          className="font-body text-sm font-semibold underline-offset-4 hover:underline"
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={invite ? "Welcome to SporeERP" : "Choose a new password"}
      subtitle={invite ? "Set a password to activate your staff account." : undefined}
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
