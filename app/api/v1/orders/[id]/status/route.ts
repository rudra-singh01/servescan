import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { orderStatusSchema } from '@/lib/validations/schemas';
import * as orderService from '@/lib/services/order.service';
import { ValidationError } from '@/lib/api/errors';

export const PATCH = withAuth(async (req, { tenant }, params) => {
  const body = await req.json();
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const order = await orderService.updateOrderStatus(
    params!.id,
    tenant.id,
    parsed.data.status,
  );
  return success(order);
});
