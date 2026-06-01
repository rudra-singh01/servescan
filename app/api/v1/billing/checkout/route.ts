import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { billingCheckoutSchema } from '@/lib/validations/schemas';
import * as billing from '@/lib/services/billing.service';
import { ValidationError } from '@/lib/api/errors';
import type { Plan } from '@/lib/constants';

export const runtime = 'nodejs';

export const POST = withAuth(async (req, { tenant, user }) => {
  const body = await req.json();
  const parsed = billingCheckoutSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const targetPlan = parsed.data.plan as Exclude<Plan, 'free'>;
  if (tenant.plan === targetPlan) {
    throw new ValidationError('You are already on this plan');
  }

  const phone = tenant.phone?.replace(/\D/g, '').slice(-10);
  if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
    throw new ValidationError('Add a valid 10-digit phone number in your profile before upgrading');
  }

  const checkout = await billing.createCashfreeCheckout(tenant.id, targetPlan, {
    phone,
    email: tenant.email ?? user.email,
    name: tenant.name,
  });

  return success(checkout, 201);
});
