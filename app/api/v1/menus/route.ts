import { withAuth, getCachedPlan } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { menuCreateSchema } from '@/lib/validations/schemas';
import * as menuService from '@/lib/services/menu.service';
import { db } from '@/lib/db';
import { branches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ValidationError } from '@/lib/api/errors';

export const GET = withAuth(async (_req, { tenant }) => {
  const menus = await menuService.listMenus(tenant.id);
  return success(menus);
});

export const POST = withAuth(async (req, { tenant }) => {
  const body = await req.json();
  const parsed = menuCreateSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const [branch] = await db!
    .select()
    .from(branches)
    .where(eq(branches.tenantId, tenant.id))
    .limit(1);
  if (!branch) throw new ValidationError('No branch found');

  const plan = await getCachedPlan(tenant.id);
  const menu = await menuService.createMenu(tenant.id, branch.id, plan, parsed.data);
  return success(menu, 201);
});
