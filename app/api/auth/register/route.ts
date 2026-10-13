import { apiErrorFrom, apiSuccess, apiValidationError } from "@/lib/api-response";
import { registerSchema } from "@/lib/validations/auth";
import { registerCustomer } from "@/services/auth.service";

export async function POST(request: Request) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiValidationError(parsed.error);

  try {
    const user = await registerCustomer(parsed.data);
    return apiSuccess({ user }, 201);
  } catch (error) {
    return apiErrorFrom(error);
  }
}
