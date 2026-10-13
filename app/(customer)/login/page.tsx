import type { Metadata } from "next";
import { AuthCard } from "@/components/forms/auth-card";
import { safeCallbackUrl } from "@/lib/form-state";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in — SporeERP" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const notice = params.reset ? "Password updated. Sign in with your new password." : undefined;

  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your SporeERP account.">
      <LoginForm callbackUrl={safeCallbackUrl(params.callbackUrl) ?? undefined} notice={notice} />
    </AuthCard>
  );
}
