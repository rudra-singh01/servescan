import { kv } from '@vercel/kv';

/** Clear cached tenant plan after billing changes (KV can stay stale for 5 min). */
export async function invalidatePlanCache(tenantId: string) {
  try {
    if (process.env.KV_REST_API_URL) {
      await kv.del(`plan:tenant:${tenantId}`);
    }
  } catch {
    // ignore
  }
}
