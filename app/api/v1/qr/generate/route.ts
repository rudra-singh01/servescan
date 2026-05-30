import { withAuth } from '@/lib/api/handler';
import { getCachedPlan } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { qrGenerateSchema } from '@/lib/validations/schemas';
import * as qrService from '@/lib/services/qr.service';
import { db } from '@/lib/db';
import { branches } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ValidationError } from '@/lib/api/errors';

export const runtime = 'nodejs';

export const POST = withAuth(async (req, { tenant }) => {
  const body = await req.json();
  const parsed = qrGenerateSchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const [branch] = await db!
    .select()
    .from(branches)
    .where(eq(branches.tenantId, tenant.id))
    .limit(1);

  const plan = await getCachedPlan(tenant.id);
  const raw = body as { baseUrl?: string };
  const baseUrl =
    typeof raw.baseUrl === 'string' && raw.baseUrl.startsWith('http') ? raw.baseUrl : undefined;

  const qr = await qrService.generateQr(
    tenant.id,
    tenant.slug,
    parsed.data.menuId,
    branch!.id,
    plan,
    {
      tableNumber: parsed.data.tableNumber,
      size: parsed.data.size,
      style: parsed.data.style,
      baseUrl,
    },
  );
  return success(qr, 201);
});
