import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as qrService from '@/lib/services/qr.service';

export const GET = withAuth(async (_req, { tenant }) => {
  const codes = await qrService.listQrCodes(tenant.id);
  return success(codes);
});
