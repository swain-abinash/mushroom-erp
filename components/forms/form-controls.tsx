"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form-state";
import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  errors?: string[];
}

export function Field({ label, name, errors, className, ...props }: FieldProps) {
  const errorId = errors?.length ? `${name}-error` : undefined;
  return (
    <label className="flex flex-col gap-1.5 font-body text-sm">
      <span className="font-medium">{label}</span>
      <input
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "rounded-lg border border-current/20 bg-transparent px-3 py-2 outline-none focus:border-current/60",
          Boolean(errors?.length) && "border-alert-coral",
          className,
        )}
        {...props}
      />
      {errors?.length ? (
        <span id={errorId} className="text-xs text-alert-coral">
          {errors[0]}
        </span>
      ) : null}
    </label>
  );
}

export function SubmitButton({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={cn("disabled:opacity-60", className)}>
      {pending ? "Please wait…" : children}
    </Button>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-alert-coral/10 px-3 py-2 font-body text-sm text-alert-coral"
      >
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p
        role="status"
        className="rounded-lg bg-success-mint/10 px-3 py-2 font-body text-sm text-success-mint"
      >
        {state.success}
      </p>
    );
  }
  return null;
}
