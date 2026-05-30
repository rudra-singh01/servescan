import { withUserAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { tenantCreateSchema } from '@/lib/validations/schemas';
import * as onboarding from '@/lib/services/onboarding.service';
import { ValidationError } from '@/lib/api/errors';

export const POST = withUserAuth(async (req, { user }) => {
  const body = await req.json();
  const parsed = tenantCreateSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const result = await onboarding.onboardTenant(user.id, parsed.data);
  return success(result, 201);
});
