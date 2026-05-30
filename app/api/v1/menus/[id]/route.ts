import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as menuService from '@/lib/services/menu.service';

export const GET = withAuth(async (_req, { tenant }, params) => {
  const menu = await menuService.getMenuWithDetails(params!.id, tenant.id);
  return success(menu);
});

export const PATCH = withAuth(async (req, { tenant }, params) => {
  const body = await req.json();
  const menu = await menuService.updateMenu(params!.id, tenant.id, body);
  return success(menu);
});

export const DELETE = withAuth(async (_req, { tenant }, params) => {
  const menu = await menuService.deactivateMenu(params!.id, tenant.id);
  return success(menu);
});
