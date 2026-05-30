import { db } from '@/lib/db';
import { menus, categories, items, tenants } from '@/lib/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';
import { slugify } from '@/lib/utils/slugify';
import { PlanLimitError, NotFoundError, ConflictError } from '@/lib/api/errors';
import { PLAN_LIMITS } from '@/lib/razorpay/plans';
import type { Plan } from '@/lib/constants';
import { MENU_TEMPLATE_DATA } from '@/lib/data/menu-templates';
import type { MenuCreateInput } from '@/lib/validations/schemas';
import type { MenuTemplate } from '@/lib/constants';

/** List menus for tenant. */
export async function listMenus(tenantId: string) {
  return db!
    .select()
    .from(menus)
    .where(eq(menus.tenantId, tenantId))
    .orderBy(asc(menus.createdAt));
}

/** Get menu with categories and items. */
export async function getMenuWithDetails(menuId: string, tenantId: string) {
  const [menu] = await db!
    .select()
    .from(menus)
    .where(and(eq(menus.id, menuId), eq(menus.tenantId, tenantId)))
    .limit(1);
  if (!menu) throw new NotFoundError('Menu not found');

  const cats = await db!
    .select()
    .from(categories)
    .where(eq(categories.menuId, menuId))
    .orderBy(asc(categories.sortOrder));

  const allItems = await db!
    .select()
    .from(items)
    .where(eq(items.menuId, menuId))
    .orderBy(asc(items.sortOrder));

  return {
    ...menu,
    categories: cats.map((c) => ({
      ...c,
      items: allItems.filter((i) => i.categoryId === c.id),
    })),
  };
}

/** Create menu with plan limit check. */
export async function createMenu(
  tenantId: string,
  branchId: string,
  plan: Plan,
  input: MenuCreateInput,
) {
  const existing = await listMenus(tenantId);
  const max = PLAN_LIMITS[plan].menus;
  if (existing.length >= max) {
    throw new PlanLimitError('menus', max);
  }

  const slug = slugify(input.name);
  const [menu] = await db!
    .insert(menus)
    .values({
      tenantId,
      branchId,
      name: input.name,
      slug,
      description: input.description,
      language: input.language,
      isActive: existing.length === 0,
    })
    .returning();
  return menu;
}

/** Create menu from template. */
export async function createMenuFromTemplate(
  tenantId: string,
  branchId: string,
  plan: Plan,
  template: MenuTemplate,
  menuName?: string,
) {
  const name = menuName ?? `${template.charAt(0).toUpperCase() + template.slice(1)} Menu`;
  const menu = await createMenu(tenantId, branchId, plan, { name, language: 'en' });

  if (template === 'custom') return menu;

  const templateData = MENU_TEMPLATE_DATA[template];
  let catOrder = 0;
  for (const cat of templateData) {
    const [category] = await db!
      .insert(categories)
      .values({
        menuId: menu.id,
        tenantId,
        name: cat.name,
        nameHi: cat.nameHi,
        sortOrder: catOrder++,
      })
      .returning();

    let itemOrder = 0;
    for (const item of cat.items) {
      await db!.insert(items).values({
        categoryId: category.id,
        menuId: menu.id,
        tenantId,
        name: item.name,
        nameHi: item.nameHi,
        price: String(item.price),
        isVeg: item.isVeg ?? null,
        sortOrder: itemOrder++,
      });
    }
  }
  return menu;
}

/** Activate menu — only one active per branch. */
export async function activateMenu(menuId: string, tenantId: string) {
  const menu = await getMenuWithDetails(menuId, tenantId);
  const itemCount = menu.categories.reduce((sum, c) => sum + c.items.length, 0);
  if (itemCount === 0) {
    throw new ConflictError('Add at least 1 item to activate this menu');
  }

  return db!.transaction(async (tx) => {
    await tx
      .update(menus)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(menus.branchId, menu.branchId), eq(menus.tenantId, tenantId)));

    const [activated] = await tx
      .update(menus)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(menus.id, menuId))
      .returning();
    return activated;
  });
}

/** Get public menu by tenant slug. */
export async function getPublicMenu(tenantSlug: string, preview = false) {
  const [tenant] = await db!
    .select()
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);
  if (!tenant?.isActive) throw new NotFoundError('Restaurant not found');

  const [menu] = await db!
    .select()
    .from(menus)
    .where(
      preview
        ? eq(menus.tenantId, tenant.id)
        : and(eq(menus.tenantId, tenant.id), eq(menus.isActive, true), eq(menus.isPublic, true)),
    )
    .orderBy(desc(menus.isActive))
    .limit(1);
  if (!menu) throw new NotFoundError('Menu not available');

  const details = await getMenuWithDetails(menu.id, tenant.id);
  const activeCategories = details.categories
    .filter((c) => c.isActive)
    .map((c) => ({
      ...c,
      items: c.items.filter((i) => preview || i.isAvailable),
    }))
    .filter((c) => c.items.length > 0);

  const allUnavailable =
    details.categories.flatMap((c) => c.items).length > 0 && activeCategories.length === 0;

  return {
    tenant,
    menu: { ...details, categories: activeCategories },
    allUnavailable,
  };
}

/** Update menu metadata. */
export async function updateMenu(
  menuId: string,
  tenantId: string,
  data: Partial<MenuCreateInput & { isPublic?: boolean }>,
) {
  const [updated] = await db!
    .update(menus)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.language && { language: data.language }),
      updatedAt: new Date(),
    })
    .where(and(eq(menus.id, menuId), eq(menus.tenantId, tenantId)))
    .returning();
  if (!updated) throw new NotFoundError();
  return updated;
}

/** Delete (deactivate) menu. */
export async function deactivateMenu(menuId: string, tenantId: string) {
  const [updated] = await db!
    .update(menus)
    .set({ isActive: false, isPublic: false, updatedAt: new Date() })
    .where(and(eq(menus.id, menuId), eq(menus.tenantId, tenantId)))
    .returning();
  if (!updated) throw new NotFoundError();
  return updated;
}
