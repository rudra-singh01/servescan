import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as orderService from '@/lib/services/order.service';

export const GET = withAuth(async (req, { tenant }) => {
  const status = req.nextUrl.searchParams.get('status') ?? undefined;
  const orders = await orderService.listOrders(tenant.id, { status });
  return success(orders);
});
