import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as menuService from '@/lib/services/menu.service';

export const POST = withAuth(async (_req, { tenant }, params) => {
  const menu = await menuService.activateMenu(params!.id, tenant.id);
  return success(menu);
});
