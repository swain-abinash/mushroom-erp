import { apiErrorFrom, apiSuccess, apiValidationError } from "@/lib/api-response";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { requestPasswordReset } from "@/services/auth.service";

export async function POST(request: Request) {
  const parsed = forgotPasswordSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    await requestPasswordReset(parsed.data.email);
    return apiSuccess({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    return apiErrorFrom(error);
  }
}
