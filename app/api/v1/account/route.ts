import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@/lib/auth/server';

/** Schedule tenant data deletion (DPDP compliance). */
export const DELETE = withAuth(async (_req, { tenant, user }) => {
  await db!
    .update(tenants)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(tenants.id, tenant.id));

  const supabase = await createClient();
  await supabase.auth.signOut();

  return success({
    message: 'Account scheduled for deletion within 30 days',
    tenantId: tenant.id,
    userId: user.id,
  });
});
