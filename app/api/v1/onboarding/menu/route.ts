import { withAuth, getCachedPlan } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { onboardingMenuSchema } from '@/lib/validations/schemas';
import * as onboarding from '@/lib/services/onboarding.service';
import { db } from '@/lib/db';
import { branches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ValidationError } from '@/lib/api/errors';

export const POST = withAuth(async (req, { tenant }) => {
  const body = await req.json();
  const parsed = onboardingMenuSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const [branch] = await db!
    .select()
    .from(branches)
    .where(eq(branches.tenantId, tenant.id))
    .limit(1);
  if (!branch) throw new ValidationError('No branch found');

  const plan = await getCachedPlan(tenant.id);
  const menu = await onboarding.onboardMenu(
    tenant.id,
    branch.id,
    plan,
    parsed.data.template,
    parsed.data.menuName,
  );
  return success(menu, 201);
});
