import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as billing from '@/lib/services/billing.service';

export const GET = withAuth(async (_req, { tenant }) => {
  const sub = await billing.getSubscription(tenant.id);
  return success(sub);
});
