import { db } from '@/lib/db';
import { tenants, subscriptions, planPayments } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { PLAN_LIMITS, PLAN_PRICES } from '@/lib/billing/plans';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import type { Plan } from '@/lib/constants';
import { createPaymentOrder, getPaymentOrder } from '@/lib/cashfree/client';
import { isCashfreeConfigured } from '@/lib/cashfree/config';
import { randomUUID } from 'crypto';
import { invalidatePlanCache } from '@/lib/plan/cache';

const PAID_STATUSES = new Set(['PAID', 'SUCCESS', 'ACTIVE']);

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
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const [tenant] = await db!
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) throw new NotFoundError();
  return { tenant, subscription: sub ?? null };
}

/** Start Cashfree checkout for a paid plan. */
export async function createCashfreeCheckout(
  tenantId: string,
  plan: Exclude<Plan, 'free'>,
  customer: { phone: string; email?: string; name?: string },
) {
  if (!isCashfreeConfigured()) {
    throw new ValidationError('Payment gateway is not configured');
  }

  const amount = PLAN_PRICES[plan];
  const orderId = `ss_${randomUUID().replace(/-/g, '')}`;

  await db!.insert(planPayments).values({
    tenantId,
    plan,
    orderId,
    amount: String(amount),
    status: 'pending',
  });

  let cfOrder;
  try {
    cfOrder = await createPaymentOrder({
      orderId,
      amountInr: amount,
      tenantId,
      plan,
      customer: {
        customerId: tenantId,
        phone: customer.phone,
        email: customer.email,
        name: customer.name,
      },
    });
  } catch (e) {
    await db!.delete(planPayments).where(eq(planPayments.orderId, orderId));
    const message = e instanceof Error ? e.message : 'Payment gateway error';
    throw new ValidationError(message);
  }

  await db!
    .update(planPayments)
    .set({
      cashfreeOrderId: cfOrder.cf_order_id ?? null,
      updatedAt: new Date(),
    })
    .where(eq(planPayments.orderId, orderId));

  return {
    orderId,
    paymentSessionId: cfOrder.payment_session_id,
    cashfreeMode: process.env.NEXT_PUBLIC_CASHFREE_ENV === 'production' ? 'production' : 'sandbox',
  };
}

/** Mark plan payment paid and activate tenant plan (idempotent). */
export async function fulfillPlanPayment(orderId: string) {
  const [payment] = await db!
    .select()
    .from(planPayments)
    .where(eq(planPayments.orderId, orderId))
    .limit(1);

  if (!payment) throw new NotFoundError('Payment not found');
  if (payment.status === 'paid') {
    return { alreadyFulfilled: true, tenantId: payment.tenantId, plan: payment.plan as Plan };
  }

  await activatePlan(payment.tenantId, payment.plan as Plan, {
    cashfreeOrderId: payment.cashfreeOrderId ?? orderId,
  });

  await db!
    .update(planPayments)
    .set({ status: 'paid', updatedAt: new Date() })
    .where(eq(planPayments.id, payment.id));

  return { alreadyFulfilled: false, tenantId: payment.tenantId, plan: payment.plan as Plan };
}

/** Verify order with Cashfree API and fulfill if paid (return page). */
export async function verifyAndFulfillCashfreeOrder(orderId: string, tenantId: string) {
  const [payment] = await db!
    .select()
    .from(planPayments)
    .where(eq(planPayments.orderId, orderId))
    .limit(1);

  if (!payment || payment.tenantId !== tenantId) {
    throw new NotFoundError('Payment not found');
  }

  if (payment.status === 'paid') {
    return { status: 'paid' as const, plan: payment.plan as Plan };
  }

  const cfOrder = await getPaymentOrder(orderId);
  const paid = PAID_STATUSES.has((cfOrder.order_status ?? '').toUpperCase());

  if (!paid) {
    return { status: 'pending' as const, plan: payment.plan as Plan };
  }

  await fulfillPlanPayment(orderId);
  return { status: 'paid' as const, plan: payment.plan as Plan };
}

/** Update tenant plan after successful payment. */
export async function activatePlan(
  tenantId: string,
  plan: Plan,
  refs?: { razorpaySubId?: string; cashfreeOrderId?: string },
) {
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

    if (refs?.razorpaySubId || refs?.cashfreeOrderId) {
      await tx.insert(subscriptions).values({
        tenantId,
        plan,
        status: 'active',
        razorpaySubId: refs.razorpaySubId,
        cashfreeOrderId: refs.cashfreeOrderId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      });
    }
  });

  await invalidatePlanCache(tenantId);
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
  await invalidatePlanCache(tenantId);
}
