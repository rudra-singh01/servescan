import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import * as qrService from '@/lib/services/qr.service';

export const runtime = 'nodejs';

/** Rebuild all QR images/URLs for the tenant using the current production URL. */
export const POST = withAuth(async (req, { tenant }) => {
  let baseUrl: string | undefined;
  try {
    const body = (await req.json()) as { baseUrl?: string };
    if (typeof body.baseUrl === 'string' && body.baseUrl.startsWith('http')) {
      baseUrl = body.baseUrl;
    }
  } catch {
    // empty body is fine
  }

  const codes = await qrService.regenerateQrCodes(tenant.id, tenant.slug, baseUrl);
  return success({ updated: codes.length, codes });
});
