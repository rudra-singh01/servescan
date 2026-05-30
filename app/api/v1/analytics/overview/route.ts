import { withAuth, getCachedPlan } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as analytics from '@/lib/services/analytics.service';
import { subDays } from 'date-fns';

export const GET = withAuth(async (req, { tenant }) => {
  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '7', 10);
  const from = subDays(new Date(), days);
  const to = new Date();
  const plan = await getCachedPlan(tenant.id);
  const overview = await analytics.getOverview(tenant.id, plan, from, to);
  return success(overview);
});
