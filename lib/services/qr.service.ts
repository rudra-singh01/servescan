import QRCode from 'qrcode';
import { db } from '@/lib/db';
import { qrCodes, menus } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAppUrl } from '@/lib/utils/app-url';
import { NotFoundError, PlanLimitError } from '@/lib/api/errors';
import { PLAN_LIMITS } from '@/lib/razorpay/plans';
import type { Plan } from '@/lib/constants';

const SIZE_MAP = { small: 200, medium: 400, large: 800 };

function resolveAppUrl(baseUrl?: string): string {
  if (baseUrl?.trim()) return baseUrl.trim().replace(/\/$/, '');
  return getAppUrl();
}

/** Build QR target URL. */
export function buildQrUrl(
  tenantSlug: string,
  _menuSlug: string,
  qrId: string,
  table?: string,
  baseUrl?: string,
) {
  const base = `${resolveAppUrl(baseUrl)}/m/${tenantSlug}`;
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
  options: {
    tableNumber?: string;
    size?: keyof typeof SIZE_MAP;
    style?: string;
    baseUrl?: string;
  },
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

  const url = buildQrUrl(
    tenantSlug,
    menu.slug,
    qrRecord.id,
    options.tableNumber,
    options.baseUrl,
  );
  const { pngBuffer, dataUrl } = await renderQrPng(url, options.size ?? 'medium');

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

async function renderQrPng(url: string, size: keyof typeof SIZE_MAP = 'medium') {
  const width = SIZE_MAP[size];
  const pngBuffer = await QRCode.toBuffer(url, {
    width,
    margin: 2,
    errorCorrectionLevel: 'M',
  });
  return {
    pngBuffer,
    dataUrl: `data:image/png;base64,${pngBuffer.toString('base64')}`,
  };
}

/** Re-encode existing QR records with the current app URL (fixes localhost URLs after deploy). */
export async function regenerateQrCodes(
  tenantId: string,
  tenantSlug: string,
  baseUrl?: string,
) {
  const records = await listQrCodes(tenantId);
  if (records.length === 0) return [];

  const updated = [];

  for (const record of records) {
    const [menu] = await db!
      .select({ slug: menus.slug })
      .from(menus)
      .where(eq(menus.id, record.menuId))
      .limit(1);
    if (!menu) continue;

    const url = buildQrUrl(
      tenantSlug,
      menu.slug,
      record.id,
      record.tableNumber ?? undefined,
      baseUrl,
    );
    const { dataUrl } = await renderQrPng(url, 'medium');

    const [row] = await db!
      .update(qrCodes)
      .set({ url, imageUrl: dataUrl })
      .where(and(eq(qrCodes.id, record.id), eq(qrCodes.tenantId, tenantId)))
      .returning();

    if (row) updated.push(row);
  }

  return updated;
}
