import { PLANS, type Plan } from '@/lib/constants';

export function normalizePlan(plan: string | null | undefined): Plan {
  if (plan && (PLANS as readonly string[]).includes(plan)) {
    return plan as Plan;
  }
  return 'free';
}
