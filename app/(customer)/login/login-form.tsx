"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Field, FormMessage, SubmitButton } from "@/components/forms/form-controls";

export function LoginForm({ callbackUrl, notice }: { callbackUrl?: string; notice?: string }) {
  const [state, formAction] = useActionState(loginAction, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {notice && !state.error ? <FormMessage state={{ success: notice }} /> : null}
      <FormMessage state={state} />
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={state.fieldErrors?.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        errors={state.fieldErrors?.password}
      />
      <Link
        href="/forgot-password"
        className="self-end font-body text-sm underline-offset-4 hover:underline"
      >
        Forgot password?
      </Link>
      <SubmitButton>Sign in</SubmitButton>
      <p className="text-center font-body text-sm">
        New here?{" "}
        <Link
          href={
            callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"
          }
          className="font-semibold underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
