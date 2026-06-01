import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { categoryCreateSchema } from '@/lib/validations/schemas';
import { db } from '@/lib/db';
import { categories, items } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/api/errors';
import { assertHindiMenu } from '@/lib/plan/hindi-menu';
import { normalizePlan } from '@/lib/plan/normalize';

export const PATCH = withAuth(async (req, { tenant }, params) => {
  const body = await req.json();
  const parsed = categoryCreateSchema.partial().safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  if (parsed.data.nameHi !== undefined) {
    assertHindiMenu(normalizePlan(tenant.plan));
  }

  const [updated] = await db!
    .update(categories)
    .set({
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.nameHi !== undefined && { nameHi: parsed.data.nameHi }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      updatedAt: new Date(),
    })
    .where(and(eq(categories.id, params!.id), eq(categories.tenantId, tenant.id)))
    .returning();

  if (!updated) throw new NotFoundError('Category not found');
  return success(updated);
});

export const DELETE = withAuth(async (_req, { tenant }, params) => {
  const [cat] = await db!
    .select()
    .from(categories)
    .where(and(eq(categories.id, params!.id), eq(categories.tenantId, tenant.id)))
    .limit(1);

  if (!cat) throw new NotFoundError('Category not found');

  const existingItems = await db!
    .select({ id: items.id })
    .from(items)
    .where(eq(items.categoryId, params!.id))
    .limit(1);

  if (existingItems.length > 0) {
    throw new ConflictError(
      'This category has items — delete all items first',
    );
  }

  await db!.delete(categories).where(eq(categories.id, params!.id));
  return success({ deleted: true });
});
