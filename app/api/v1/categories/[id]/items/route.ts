import { withAuth, getCachedPlan } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { itemCreateSchema } from '@/lib/validations/schemas';
import * as itemService from '@/lib/services/item.service';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ValidationError, NotFoundError } from '@/lib/api/errors';

export const POST = withAuth(async (req, { tenant }, params) => {
  const body = await req.json();
  const parsed = itemCreateSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const [cat] = await db!
    .select()
    .from(categories)
    .where(and(eq(categories.id, params!.id), eq(categories.tenantId, tenant.id)))
    .limit(1);
  if (!cat) throw new NotFoundError('Category not found');

  const plan = await getCachedPlan(tenant.id);
  const item = await itemService.createItem(
    params!.id,
    cat.menuId,
    tenant.id,
    plan,
    parsed.data,
  );
  return success(item, 201);
});
