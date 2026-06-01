import { db } from '@/lib/db';
import { items, categories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { NotFoundError } from '@/lib/api/errors';
import type { ItemCreateInput } from '@/lib/validations/schemas';
import { PLAN_LIMITS } from '@/lib/razorpay/plans';
import type { Plan } from '@/lib/constants';
import { PlanLimitError } from '@/lib/api/errors';

/** Create item in category. */
export async function createItem(
  categoryId: string,
  menuId: string,
  tenantId: string,
  plan: Plan,
  input: ItemCreateInput,
) {
  const existing = await db!
    .select({ id: items.id })
    .from(items)
    .where(eq(items.menuId, menuId));
  const max = PLAN_LIMITS[plan].itemsPerMenu;
  if (existing.length >= max) throw new PlanLimitError('items', max);

  const existingInCategory = await db!
    .select({ sortOrder: items.sortOrder })
    .from(items)
    .where(eq(items.categoryId, categoryId));
  const maxSort = existingInCategory.reduce((m, r) => Math.max(m, r.sortOrder), -1);

  const [item] = await db!
    .insert(items)
    .values({
      categoryId,
      menuId,
      tenantId,
      name: input.name,
      nameHi: input.nameHi,
      description: input.description,
      price: String(input.price),
      comparePrice: input.comparePrice ? String(input.comparePrice) : null,
      isVeg: input.isVeg ?? null,
      isAvailable: input.isAvailable,
      isFeatured: input.isFeatured,
      isSpicy: input.isSpicy,
      tags: input.tags,
      allergens: input.allergens,
      imageUrl: input.imageUrl,
      sortOrder: maxSort + 1,
    })
    .returning();
  return item;
}

/** Toggle item availability (fast path). */
export async function toggleAvailability(itemId: string, tenantId: string, isAvailable: boolean) {
  const [item] = await db!
    .update(items)
    .set({ isAvailable, updatedAt: new Date() })
    .where(and(eq(items.id, itemId), eq(items.tenantId, tenantId)))
    .returning();
  if (!item) throw new NotFoundError('Item not found');
  return item;
}

/** Update item. */
export async function updateItem(itemId: string, tenantId: string, input: Partial<ItemCreateInput>) {
  const [item] = await db!
    .update(items)
    .set({
      ...(input.name && { name: input.name }),
      ...(input.nameHi !== undefined && { nameHi: input.nameHi }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.price !== undefined && { price: String(input.price) }),
      ...(input.isVeg !== undefined && { isVeg: input.isVeg }),
      ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl }),
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, itemId), eq(items.tenantId, tenantId)))
    .returning();
  if (!item) throw new NotFoundError();
  return item;
}

/** Delete item. */
export async function deleteItem(itemId: string, tenantId: string) {
  const [deleted] = await db!
    .delete(items)
    .where(and(eq(items.id, itemId), eq(items.tenantId, tenantId)))
    .returning();
  if (!deleted) throw new NotFoundError();
  return deleted;
}

/** Reorder items. */
export async function reorderItems(
  updates: { id: string; sortOrder: number }[],
  tenantId: string,
) {
  await db!.transaction(async (tx) => {
    for (const u of updates) {
      await tx
        .update(items)
        .set({ sortOrder: u.sortOrder, updatedAt: new Date() })
        .where(and(eq(items.id, u.id), eq(items.tenantId, tenantId)));
    }
  });
}

/** Create category. */
export async function createCategory(
  menuId: string,
  tenantId: string,
  plan: Plan,
  input: { name: string; nameHi?: string | null; description?: string },
) {
  const existing = await db!
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.menuId, menuId));
  const max = PLAN_LIMITS[plan].categories;
  if (existing.length >= max) throw new PlanLimitError('categories', max);

  const [cat] = await db!
    .insert(categories)
    .values({
      menuId,
      tenantId,
      name: input.name,
      nameHi: input.nameHi,
      description: input.description,
      sortOrder: existing.length,
    })
    .returning();
  return cat;
}
