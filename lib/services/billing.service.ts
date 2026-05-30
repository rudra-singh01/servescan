import { db } from '@/lib/db';
import { tenants, subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PLAN_LIMITS, PLAN_PRICES } from '@/lib/razorpay/plans';
import { NotFoundError } from '@/lib/api/errors';
import type { Plan } from '@/lib/constants';

/** Get available plans for display. */
export function getPlans() {
  return (['free', 'starter', 'pro', 'business'] as Plan[]).map((plan) => ({
    id: plan,
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    price: plan === 'free' ? 0 : PLAN_PRICES[plan as keyof typeof PLAN_PRICES],
    limits: PLAN_LIMITS[plan],
  }));
}

/** Get current subscription for tenant. */
export async function getSubscription(tenantId: string) {
  const [sub] = await db!
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.tenantId, tenantId))
    .orderBy(subscriptions.createdAt)
    .limit(1);

  const [tenant] = await db!
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) throw new NotFoundError();
  return { tenant, subscription: sub ?? null };
}

/** Update tenant plan after successful payment. */
export async function activatePlan(tenantId: string, plan: Plan, razorpaySubId?: string) {
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await db!.transaction(async (tx) => {
    await tx
      .update(tenants)
      .set({
        plan,
        planExpiresAt: periodEnd,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId));

    if (razorpaySubId) {
      await tx.insert(subscriptions).values({
        tenantId,
        plan,
        status: 'active',
        razorpaySubId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      });
    }
  });
}

/** Cancel subscription at period end. */
export async function cancelSubscription(tenantId: string) {
  const [sub] = await db!
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptions.tenantId, tenantId))
    .returning();
  return sub;
}

/** Downgrade to free after grace period. */
export async function downgradeToFree(tenantId: string) {
  await db!
    .update(tenants)
    .set({ plan: 'free', planExpiresAt: null, updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
}
