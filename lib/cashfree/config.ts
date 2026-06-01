export type CashfreeEnvironment = 'sandbox' | 'production';

export function getCashfreeEnvironment(): CashfreeEnvironment {
  return process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox';
}

export function getCashfreeBaseUrl(): string {
  return getCashfreeEnvironment() === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
}

export function getCashfreeCredentials() {
  const appId = process.env.CASHFREE_APP_ID?.trim();
  const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
  if (!appId || !secretKey) {
    throw new Error('Cashfree is not configured. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.');
  }
  return { appId, secretKey };
}

export function isCashfreeConfigured(): boolean {
  return Boolean(process.env.CASHFREE_APP_ID?.trim() && process.env.CASHFREE_SECRET_KEY?.trim());
}
