import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { inngest } from '@/lib/inngest/client';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret || !signature) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (expected !== signature) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  const event = JSON.parse(body);
  await inngest.send({
    name: 'razorpay/webhook.received',
    data: event,
  });

  return NextResponse.json({ received: true });
}
