import crypto from 'crypto';
import { getAppUrl } from '@/lib/utils/app-url';
import {
  getCashfreeBaseUrl,
  getCashfreeCredentials,
  getCashfreeEnvironment,
} from '@/lib/cashfree/config';

const API_VERSION = '2023-08-01';

type CreateOrderInput = {
  orderId: string;
  amountInr: number;
  tenantId: string;
  plan: string;
  customer: {
    customerId: string;
    phone: string;
    email?: string;
    name?: string;
  };
};

export type CashfreeOrderResponse = {
  cf_order_id?: string;
  order_id: string;
  payment_session_id: string;
  order_status?: string;
};

async function cashfreeRequest<T>(path: string, init: RequestInit): Promise<T> {
  const { appId, secretKey } = getCashfreeCredentials();
  const base = getCashfreeBaseUrl();

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': API_VERSION,
      'x-client-id': appId,
      'x-client-secret': secretKey,
      ...init.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (data as { message?: string }).message ??
      (data as { error?: string }).error ??
      `Cashfree API error (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

/** Create a Cashfree PG order and return payment_session_id for checkout. */
export async function createPaymentOrder(input: CreateOrderInput): Promise<CashfreeOrderResponse> {
  const appUrl = getAppUrl();
  const returnUrl = `${appUrl}/settings/billing/return?order_id={order_id}`;
  const notifyUrl = `${appUrl}/api/v1/webhooks/cashfree`;

  const body = {
    order_id: input.orderId,
    order_amount: input.amountInr,
    order_currency: 'INR',
    customer_details: {
      customer_id: input.customer.customerId,
      customer_phone: input.customer.phone,
      customer_email: input.customer.email,
      customer_name: input.customer.name,
    },
    order_meta: {
      return_url: returnUrl,
      notify_url: notifyUrl,
    },
    order_note: `ScanServe ${input.plan} plan`,
    order_tags: {
      tenant_id: input.tenantId,
      plan: input.plan,
    },
  };

  return cashfreeRequest<CashfreeOrderResponse>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Fetch order status from Cashfree (used on return URL). */
export async function getPaymentOrder(orderId: string) {
  return cashfreeRequest<{
    order_id: string;
    order_status: string;
    cf_order_id?: string;
  }>(`/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
}

/** Verify Cashfree webhook signature (timestamp + raw body). */
export function verifyWebhookSignature(
  signature: string | null,
  timestamp: string | null,
  rawBody: string,
): boolean {
  if (!signature || !timestamp) return false;
  const { secretKey } = getCashfreeCredentials();
  const payload = timestamp + rawBody;
  const expected = crypto.createHmac('sha256', secretKey).update(payload).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function getPublicCashfreeMode(): 'sandbox' | 'production' {
  return getCashfreeEnvironment();
}
