import { NextResponse } from "next/server";
import type { z } from "zod";
import { ServiceError } from "@/lib/errors";

// Response envelopes — doc/05_API_SPECIFICATION_AND_CONTRACTS.md §1.

function meta() {
  return { timestamp: new Date().toISOString(), requestId: `req_${crypto.randomUUID()}` };
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, meta: meta() }, { status });
}

export function apiError(
  code: string,
  message: string,
  status: number,
  details?: Array<{ field: string; issue: string }>,
) {
  return NextResponse.json(
    { success: false, error: { code, message, details }, meta: meta() },
    { status },
  );
}

export function apiValidationError(error: z.ZodError) {
  return apiError(
    "VALIDATION_ERROR",
    "The request body is invalid.",
    422,
    error.issues.map((issue) => ({ field: issue.path.join("."), issue: issue.message })),
  );
}

/** Maps known service errors to the error envelope; anything else becomes a 500. */
export function apiErrorFrom(error: unknown) {
  if (error instanceof ServiceError) {
    return apiError(
      error.code,
      error.message,
      error.status,
      error.field ? [{ field: error.field, issue: error.code }] : undefined,
    );
  }
  console.error(error);
  return apiError("INTERNAL_ERROR", "Something went wrong.", 500);
}
