import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { scans, orders, menus } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { PLAN_LIMITS } from '@/lib/razorpay/plans';
import type { Plan } from '@/lib/constants';
import { subDays } from 'date-fns';

/** Record a menu scan event. */
export async function recordScan(data: {
  menuId: string;
  tenantId: string;
  branchId?: string;
  tableNumber?: string;
  userAgent?: string;
  ip?: string;
  sessionId?: string;
}) {
  const ipHash = data.ip
    ? createHash('sha256').update(data.ip).digest('hex')
    : undefined;

  await db!.insert(scans).values({
    menuId: data.menuId,
    tenantId: data.tenantId,
    branchId: data.branchId,
    tableNumber: data.tableNumber,
    userAgent: data.userAgent,
    ipHash,
    sessionId: data.sessionId,
  });

  await db!
    .update(menus)
    .set({ scanCount: sql`${menus.scanCount} + 1` })
    .where(eq(menus.id, data.menuId));
}

/** Analytics overview for date range. */
export async function getOverview(tenantId: string, plan: Plan, from: Date, to: Date) {
  const daysLimit = PLAN_LIMITS[plan].analyticsDays;
  const earliest = subDays(new Date(), daysLimit);
  const effectiveFrom = from < earliest ? earliest : from;

  const [scanStats] = await db!
    .select({ count: sql<number>`count(*)::int` })
    .from(scans)
    .where(
      and(
        eq(scans.tenantId, tenantId),
        gte(scans.createdAt, effectiveFrom),
        lte(scans.createdAt, to),
      ),
    );

  const [orderStats] = await db!
    .select({
      count: sql<number>`count(*)::int`,
      revenue: sql<string>`coalesce(sum(${orders.total}), 0)`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.tenantId, tenantId),
        gte(orders.createdAt, effectiveFrom),
        lte(orders.createdAt, to),
        eq(orders.status, 'completed'),
      ),
    );

  return {
    scans: scanStats?.count ?? 0,
    orders: orderStats?.count ?? 0,
    revenue: parseFloat(orderStats?.revenue ?? '0'),
  };
}

/** Daily scan time series. */
export async function getScanTimeSeries(tenantId: string, from: Date, to: Date) {
  return db!
    .select({
      date: sql<string>`date(${scans.createdAt})`,
      count: sql<number>`count(*)::int`,
    })
    .from(scans)
    .where(
      and(eq(scans.tenantId, tenantId), gte(scans.createdAt, from), lte(scans.createdAt, to)),
    )
    .groupBy(sql`date(${scans.createdAt})`)
    .orderBy(sql`date(${scans.createdAt})`);
}

/** Peak hours heatmap data. */
export async function getPeakHours(tenantId: string, from: Date, to: Date) {
  return db!
    .select({
      hour: sql<number>`extract(hour from ${scans.createdAt})::int`,
      dayOfWeek: sql<number>`extract(dow from ${scans.createdAt})::int`,
      count: sql<number>`count(*)::int`,
    })
    .from(scans)
    .where(
      and(eq(scans.tenantId, tenantId), gte(scans.createdAt, from), lte(scans.createdAt, to)),
    )
    .groupBy(
      sql`extract(hour from ${scans.createdAt})`,
      sql`extract(dow from ${scans.createdAt})`,
    );
}
