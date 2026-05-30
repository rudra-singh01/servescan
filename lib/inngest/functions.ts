import { inngest } from './client';
import * as billing from '@/lib/services/billing.service';
import { db } from '@/lib/db';
import { orders } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import type { Plan } from '@/lib/constants';

export const razorpayWebhook = inngest.createFunction(
  {
    id: 'razorpay-webhook',
    triggers: [{ event: 'razorpay/webhook.received' }],
  },
  async ({ event }) => {
    const payload = event.data as {
      event: string;
      payload?: {
        subscription?: { entity: { id: string; notes?: { tenant_id?: string; plan?: Plan } } };
      };
    };

    if (payload.event === 'subscription.activated' || payload.event === 'subscription.charged') {
      const sub = payload.payload?.subscription?.entity;
      const tenantId = sub?.notes?.tenant_id;
      const plan = sub?.notes?.plan ?? 'starter';
      if (tenantId) {
        await billing.activatePlan(tenantId, plan, sub?.id);
      }
    }

    if (payload.event === 'subscription.cancelled') {
      const tenantId = payload.payload?.subscription?.entity?.notes?.tenant_id;
      if (tenantId) await billing.downgradeToFree(tenantId);
    }
  },
);

export const cancelStaleOrders = inngest.createFunction(
  {
    id: 'cancel-stale-orders',
    triggers: [{ cron: '*/15 * * * *' }],
  },
  async () => {
    if (!db) return;
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    await db
      .update(orders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(orders.status, 'pending'), lt(orders.createdAt, thirtyMinAgo)));
  },
);

export const functions = [razorpayWebhook, cancelStaleOrders];
