import { isWithinLimit, PLAN_LIMITS } from '@/lib/razorpay/plans';

describe('plan limits', () => {
  it('free plan allows 1 menu', () => {
    expect(isWithinLimit('free', 'menus', 0)).toBe(true);
    expect(isWithinLimit('free', 'menus', 1)).toBe(false);
  });

  it('pro plan has table ordering', () => {
    expect(PLAN_LIMITS.pro.tableOrdering).toBe(true);
  });
});
