"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-controls";

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, formAction] = useActionState(registerAction, {});
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormMessage state={state} />
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label="Full name" name="name" autoComplete="name" required errors={errors?.name} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={errors?.email}
      />
      <Field
        label="Phone (optional)"
        name="phone"
        type="tel"
        autoComplete="tel"
        errors={errors?.phone}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        errors={errors?.password}
      />
      <Field
        label="Confirm password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        errors={errors?.confirmPassword}
      />
      <SubmitButton>Create account</SubmitButton>
      <p className="text-center font-body text-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
