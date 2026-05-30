import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as analytics from '@/lib/services/analytics.service';
import { subDays } from 'date-fns';

export const GET = withAuth(async (req, { tenant }) => {
  const days = parseInt(req.nextUrl.searchParams.get('days') ?? '7', 10);
  const from = subDays(new Date(), days);
  const to = new Date();
  const series = await analytics.getScanTimeSeries(tenant.id, from, to);
  return success(series);
});
