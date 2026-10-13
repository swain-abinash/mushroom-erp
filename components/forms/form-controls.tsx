"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/form-state";
import type {
  InputHTMLAttributes,
  ReactNode,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  errors?: string[];
  ref?: Ref<HTMLInputElement>;
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

const controlClass =
  "rounded-lg border border-current/20 bg-transparent px-3 py-2 outline-none focus:border-current/60";

function FieldError({ name, errors }: { name: string; errors?: string[] }) {
  return errors?.length ? (
    <span id={`${name}-error`} className="text-xs text-alert-coral">
      {errors[0]}
    </span>
  ) : null;
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  errors?: string[];
  hint?: string;
}

export function TextArea({ label, name, errors, hint, className, ...props }: TextAreaProps) {
  return (
    <label className="flex flex-col gap-1.5 font-body text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        name={name}
        rows={4}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${name}-error` : undefined}
        className={cn(controlClass, Boolean(errors?.length) && "border-alert-coral", className)}
        {...props}
      />
      {hint ? <span className="text-xs opacity-60">{hint}</span> : null}
      <FieldError name={name} errors={errors} />
    </label>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: string;
  errors?: string[];
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function Select({
  label,
  name,
  errors,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <label className="flex flex-col gap-1.5 font-body text-sm">
      <span className="font-medium">{label}</span>
      <select
        name={name}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={errors?.length ? `${name}-error` : undefined}
        className={cn(
          controlClass,
          "[&>option]:text-charcoal-dark",
          Boolean(errors?.length) && "border-alert-coral",
          className,
        )}
        {...props}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name={name} errors={errors} />
    </label>
  );
}

export function Checkbox({
  label,
  name,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; hint?: string }) {
  return (
    <label className="flex items-start gap-2 font-body text-sm">
      <input type="checkbox" name={name} className="mt-1" {...props} />
      <span>
        <span className="font-medium">{label}</span>
        {hint ? <span className="block text-xs opacity-60">{hint}</span> : null}
      </span>
    </label>
  );
}
