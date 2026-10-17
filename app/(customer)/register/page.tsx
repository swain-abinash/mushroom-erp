import type { Metadata } from "next";
import { AuthCard } from "@/components/forms/auth-card";
import { safeCallbackUrl } from "@/lib/form-state";
import { RegisterForm } from "./register-form";

export const instant = false;
export const metadata: Metadata = { title: "Create account — SporeERP" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <AuthCard title="Create your account" subtitle="Order fresh harvest and track deliveries.">
      <RegisterForm callbackUrl={safeCallbackUrl(callbackUrl) ?? undefined} />
    </AuthCard>
  );
}
