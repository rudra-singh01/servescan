import { NextRequest } from 'next/server';
import { getUser } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { tenants, teamMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkRateLimit } from '@/lib/rate-limit';
import { handleApiError } from './response';
import { UnauthorizedError } from './errors';
import type { Tenant } from '@/lib/db/schema';
import type { Plan } from '@/lib/constants';
import { kv } from '@vercel/kv';

export type AuthContext = {
  user: { id: string; email?: string };
  tenant: Tenant;
};

type RouteHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>,
) => Promise<Response>;

type UserOnlyHandler = (
  req: NextRequest,
  ctx: { user: { id: string; email?: string } },
  params?: Record<string, string>,
) => Promise<Response>;

/**
 * Wrap API route with user-only auth (no tenant required). Use for onboarding endpoints.
 */
export function withUserAuth(handler: UserOnlyHandler, options?: { rateLimit?: 'guest' | 'authed' }) {
  return async (req: NextRequest, segmentData?: { params: Promise<Record<string, string>> }) => {
    try {
      const user = await getUser();
      if (!user) throw new UnauthorizedError();

      const { allowed } = await checkRateLimit(
        user.id,
        options?.rateLimit ?? 'authed',
      );
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const params = segmentData?.params ? await segmentData.params : undefined;
      return await handler(req, { user: { id: user.id, email: user.email } }, params);
    } catch (e) {
      return handleApiError(e);
    }
  };
}

/**
 * Wrap API route with auth, rate limit, and error handling.
 */
export function withAuth(handler: RouteHandler, options?: { rateLimit?: 'guest' | 'authed' }) {
  return async (req: NextRequest, segmentData?: { params: Promise<Record<string, string>> }) => {
    try {
      const user = await getUser();
      if (!user) throw new UnauthorizedError();

      const { allowed } = await checkRateLimit(
        user.id,
        options?.rateLimit ?? 'authed',
      );
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (!db) {
        return new Response(JSON.stringify({ error: 'database_unavailable' }), { status: 503 });
      }

      const [tenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.ownerId, user.id))
        .limit(1);

      let activeTenant = tenant;

      if (!activeTenant) {
        const [membership] = await db
          .select({ tenant: tenants })
          .from(teamMembers)
          .innerJoin(tenants, eq(teamMembers.tenantId, tenants.id))
          .where(and(eq(teamMembers.userId, user.id), eq(teamMembers.isActive, true)))
          .limit(1);
        activeTenant = membership?.tenant;
      }

      if (!activeTenant) throw new UnauthorizedError('No tenant found');

      const params = segmentData?.params ? await segmentData.params : undefined;
      return await handler(req, { user: { id: user.id, email: user.email }, tenant: activeTenant }, params);
    } catch (e) {
      return handleApiError(e);
    }
  };
}

/** Public route without auth. */
export function withPublic(
  handler: (req: NextRequest, params?: Record<string, string>) => Promise<Response>,
  rateLimitKey?: string,
) {
  return async (req: NextRequest, segmentData?: { params: Promise<Record<string, string>> }) => {
    try {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';
      const { allowed } = await checkRateLimit(rateLimitKey ?? ip, 'guest');
      if (!allowed) {
        return new Response(JSON.stringify({ error: 'rate_limit_exceeded' }), { status: 429 });
      }
      const params = segmentData?.params ? await segmentData.params : undefined;
      return await handler(req, params);
    } catch (e) {
      return handleApiError(e);
    }
  };
}

/** Get cached plan for tenant. */
export async function getCachedPlan(tenantId: string): Promise<Plan> {
  const cacheKey = `plan:tenant:${tenantId}`;
  try {
    if (process.env.KV_REST_API_URL) {
      const cached = await kv.get<Plan>(cacheKey);
      if (cached) return cached;
    }
  } catch {
    // ignore
  }
  if (!db) return 'free';
  const [t] = await db.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, tenantId));
  const plan = (t?.plan ?? 'free') as Plan;
  try {
    if (process.env.KV_REST_API_URL) await kv.set(cacheKey, plan, { ex: 300 });
  } catch {
    // ignore
  }
  return plan;
}
