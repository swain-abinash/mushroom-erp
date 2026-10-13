import type { Metadata } from "next";
import { AuthCard } from "@/components/forms/auth-card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password — SporeERP" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Forgot your password?" subtitle="We'll email you a link to reset it.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
