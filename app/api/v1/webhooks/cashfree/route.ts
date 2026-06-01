import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/cashfree/client';
import { fulfillPlanPayment } from '@/lib/services/billing.service';
import { isCashfreeConfigured } from '@/lib/cashfree/config';

export const runtime = 'nodejs';

/** Cashfree sends webhooks as JSON — signature uses raw body + timestamp. */
export async function POST(req: NextRequest) {
  if (!isCashfreeConfigured()) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-webhook-signature');
  const timestamp = req.headers.get('x-webhook-timestamp');

  if (!verifyWebhookSignature(signature, timestamp, rawBody)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  let payload: {
    type?: string;
    data?: {
      order?: { order_id?: string; order_status?: string };
      payment?: { payment_status?: string };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const orderId = payload.data?.order?.order_id;
  const orderStatus = (payload.data?.order?.order_status ?? '').toUpperCase();
  const paymentStatus = (payload.data?.payment?.payment_status ?? '').toUpperCase();

  const isSuccess =
    orderStatus === 'PAID' ||
    paymentStatus === 'SUCCESS' ||
    payload.type === 'PAYMENT_SUCCESS_WEBHOOK';

  if (isSuccess && orderId) {
    try {
      await fulfillPlanPayment(orderId);
    } catch (e) {
      console.error('Cashfree fulfill error:', e);
    }
  }

  return NextResponse.json({ received: true });
}
