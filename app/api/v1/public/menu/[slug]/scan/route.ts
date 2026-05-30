import { withPublic } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as menuService from '@/lib/services/menu.service';
import * as analytics from '@/lib/services/analytics.service';

export const POST = withPublic(async (req, params) => {
  const { menu } = await menuService.getPublicMenu(params!.slug);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0];
  const body = await req.json().catch(() => ({}));

  await analytics.recordScan({
    menuId: menu.id,
    tenantId: menu.tenantId,
    branchId: menu.branchId,
    tableNumber: body.tableNumber ?? req.nextUrl.searchParams.get('t') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
    ip,
    sessionId: body.sessionId,
  });

  return success({ recorded: true });
});
