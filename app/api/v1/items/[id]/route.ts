import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { itemCreateSchema } from '@/lib/validations/schemas';
import * as itemService from '@/lib/services/item.service';
import { ValidationError } from '@/lib/api/errors';
import { assertItemImageUpload } from '@/lib/plan/item-images';
import { assertHindiMenu } from '@/lib/plan/hindi-menu';
import { normalizePlan } from '@/lib/plan/normalize';

export const PATCH = withAuth(async (req, { tenant }, params) => {
  const body = await req.json();
  const parsed = itemCreateSchema.partial().safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const plan = normalizePlan(tenant.plan);
  if (parsed.data.imageUrl !== undefined) {
    assertItemImageUpload(plan);
  }
  if (parsed.data.nameHi !== undefined) {
    assertHindiMenu(plan);
  }

  const item = await itemService.updateItem(params!.id, tenant.id, parsed.data);
  return success(item);
});

export const DELETE = withAuth(async (_req, { tenant }, params) => {
  await itemService.deleteItem(params!.id, tenant.id);
  return success({ deleted: true });
});
