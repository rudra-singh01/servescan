import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as billing from '@/lib/services/billing.service';
import { ValidationError } from '@/lib/api/errors';

export const runtime = 'nodejs';

export const GET = withAuth(async (req, { tenant }) => {
  const orderId = req.nextUrl.searchParams.get('order_id');
  if (!orderId) throw new ValidationError('order_id is required');

  const result = await billing.verifyAndFulfillCashfreeOrder(orderId, tenant.id);
  return success(result);
});
