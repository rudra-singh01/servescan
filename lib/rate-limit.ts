import { kv } from '@vercel/kv';
import { RATE_LIMITS } from '@/lib/constants';

type RateLimitType = 'guest' | 'authed' | 'publicMenu';

const LIMITS: Record<RateLimitType, number> = {
  guest: RATE_LIMITS.guest,
  authed: RATE_LIMITS.authed,
  publicMenu: RATE_LIMITS.publicMenu,
};

/** In-memory fallback when KV is not configured. */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for identifier. Returns true if allowed.
 */
export async function checkRateLimit(
  key: string,
  type: RateLimitType = 'guest',
): Promise<{ allowed: boolean; remaining: number }> {
  const limit = LIMITS[type];
  const windowMs = 60_000;
  const now = Date.now();
  const redisKey = `ratelimit:${type}:${key}`;

  try {
    if (process.env.KV_REST_API_URL) {
      const current = await kv.incr(redisKey);
      if (current === 1) await kv.expire(redisKey, 60);
      return { allowed: current <= limit, remaining: Math.max(0, limit - current) };
    }
  } catch {
    // fall through to memory
  }

  const entry = memoryStore.get(redisKey);
  if (!entry || entry.resetAt < now) {
    memoryStore.set(redisKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  entry.count += 1;
  return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) };
}
