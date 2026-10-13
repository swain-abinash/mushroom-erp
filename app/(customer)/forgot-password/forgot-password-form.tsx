"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-controls";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(forgotPasswordAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state.fieldErrors?.email}
      />
      <SubmitButton>Send reset link</SubmitButton>
      <Link
        href="/login"
        className="text-center font-body text-sm underline-offset-4 hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
