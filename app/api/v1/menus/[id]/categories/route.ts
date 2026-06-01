import { withAuth, getCachedPlan } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { categoryCreateSchema } from '@/lib/validations/schemas';
import * as itemService from '@/lib/services/item.service';
import * as menuService from '@/lib/services/menu.service';
import { ValidationError } from '@/lib/api/errors';
import { assertHindiMenu } from '@/lib/plan/hindi-menu';
import { normalizePlan } from '@/lib/plan/normalize';

export const GET = withAuth(async (_req, { tenant }, params) => {
  const menu = await menuService.getMenuWithDetails(params!.id, tenant.id);
  return success(menu.categories);
});

export const POST = withAuth(async (req, { tenant }, params) => {
  const body = await req.json();
  const parsed = categoryCreateSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  if (parsed.data.nameHi) {
    assertHindiMenu(normalizePlan(tenant.plan));
  }

  const plan = await getCachedPlan(tenant.id);
  const category = await itemService.createCategory(
    params!.id,
    tenant.id,
    plan,
    parsed.data,
  );
  return success(category, 201);
});
