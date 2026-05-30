import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { qrCodes, menus } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { APP_URL } from '@/lib/constants';
import { NotFoundError, PlanLimitError } from '@/lib/api/errors';
import { PLAN_LIMITS } from '@/lib/razorpay/plans';
import type { Plan } from '@/lib/constants';

const SIZE_MAP = { small: 200, medium: 400, large: 800 };

/** Build QR target URL. */
export function buildQrUrl(tenantSlug: string, menuSlug: string, qrId: string, table?: string) {
  const base = `${APP_URL}/m/${tenantSlug}`;
  const params = new URLSearchParams({ qr: qrId });
  if (table) params.set('t', table);
  return `${base}?${params.toString()}`;
}

/** Generate QR code and persist record. */
export async function generateQr(
  tenantId: string,
  tenantSlug: string,
  menuId: string,
  branchId: string,
  plan: Plan,
  options: { tableNumber?: string; size?: keyof typeof SIZE_MAP; style?: string },
) {
  const existing = await db!
    .select({ id: qrCodes.id })
    .from(qrCodes)
    .where(eq(qrCodes.tenantId, tenantId));
  const max = PLAN_LIMITS[plan].qrCodes;
  if (existing.length >= max) throw new PlanLimitError('qrCodes', max);

  const [menu] = await db!
    .select()
    .from(menus)
    .where(and(eq(menus.id, menuId), eq(menus.tenantId, tenantId)))
    .limit(1);
  if (!menu) throw new NotFoundError('Menu not found');

  const [qrRecord] = await db!
    .insert(qrCodes)
    .values({
      tenantId,
      menuId,
      branchId,
      tableNumber: options.tableNumber,
      url: '', // updated below
    })
    .returning();

  const url = buildQrUrl(tenantSlug, menu.slug, qrRecord.id, options.tableNumber);
  const size = SIZE_MAP[options.size ?? 'medium'];
  const pngBuffer = await QRCode.toBuffer(url, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
  const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;

  const [updated] = await db!
    .update(qrCodes)
    .set({ url, imageUrl: dataUrl })
    .where(eq(qrCodes.id, qrRecord.id))
    .returning();

  return { ...updated, pngBuffer };
}

/** List QR codes for tenant. */
export async function listQrCodes(tenantId: string) {
  return db!.select().from(qrCodes).where(eq(qrCodes.tenantId, tenantId));
}
