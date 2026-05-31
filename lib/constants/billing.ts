export const BILLING_PATH = '/settings/billing';

/** Build billing URL when a plan limit blocks an action (no modal — redirect only). */
export function billingUrlWithReason(limit?: string): string {
  const params = new URLSearchParams({ reason: 'plan_limit' });
  if (limit) params.set('limit', limit);
  return `${BILLING_PATH}?${params.toString()}`;
}
