import { withPublic } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as orderService from '@/lib/services/order.service';

export const GET = withPublic(async (_req, params) => {
  const order = await orderService.getOrderStatus(params!.id);
  return success(order);
});
