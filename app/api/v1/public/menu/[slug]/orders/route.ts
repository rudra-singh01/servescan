import { withPublic } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { publicOrderSchema } from '@/lib/validations/schemas';
import * as menuService from '@/lib/services/menu.service';
import * as orderService from '@/lib/services/order.service';
import { getCachedPlan } from '@/lib/api/handler';
import { ValidationError } from '@/lib/api/errors';

export const POST = withPublic(async (req, params) => {
  const body = await req.json();
  const parsed = publicOrderSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const { tenant, menu } = await menuService.getPublicMenu(params!.slug);
  const plan = await getCachedPlan(tenant.id);
  const idempotencyKey = req.headers.get('x-idempotency-key') ?? undefined;

  const order = await orderService.placeOrder(
    tenant.id,
    menu.id,
    menu.branchId,
    plan,
    parsed.data,
    idempotencyKey,
  );
  return success(order, 201);
});
