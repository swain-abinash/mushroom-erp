import type { z } from "zod";
import { ServiceError } from "@/lib/errors";

export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Extra data a form may need to show after success (e.g. an invite link). */
  data?: Record<string, string>;
  /**
   * Submitted values, echoed back on failure. React resets a form after its action runs, so inputs
   * use these as `defaultValue` to keep what the user typed.
   */
  values?: Record<string, string>;
};

/** Text fields of a submission (files and repeated keys are skipped). */
export function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}

export function validationFailure(error: z.ZodError): FormState {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { fieldErrors };
}

/** Converts a service error into form state; rethrows anything unexpected. */
export function serviceFailure(error: unknown): FormState {
  if (error instanceof ServiceError) {
    return error.field
      ? { fieldErrors: { [error.field]: [error.message] } }
      : { error: error.message };
  }
  throw error;
}

/** Only allow same-origin relative paths as post-login destinations. */
export function safeCallbackUrl(
  value: FormDataEntryValue | string | null | undefined,
): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return null;
  }
  return value;
}
