import { withPublic } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as menuService from '@/lib/services/menu.service';

export const GET = withPublic(async (req, params) => {
  const preview = req.nextUrl.searchParams.get('preview') === 'true';
  const data = await menuService.getPublicMenu(params!.slug, preview);
  return success(data, 200, {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  } as Record<string, string>);
});
