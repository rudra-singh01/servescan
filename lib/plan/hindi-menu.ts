import { PlanLimitError } from '@/lib/api/errors';
import type { Plan } from '@/lib/constants';
import { PLAN_LIMITS } from '@/lib/billing/plans';
import { normalizePlan } from '@/lib/plan/normalize';

export function canUseHindiMenu(plan: string | Plan): boolean {
  return PLAN_LIMITS[normalizePlan(plan)].hindiMenu;
}

/** Paid plans only — free users get HTTP 402 with billing redirect. */
export function assertHindiMenu(plan: Plan) {
  if (!canUseHindiMenu(plan)) {
    throw new PlanLimitError('hindiMenu', 0);
  }
}

export function stripHindiIfNeeded<T extends { nameHi?: string | null }>(
  plan: Plan,
  entity: T,
): T {
  if (canUseHindiMenu(plan)) return entity;
  return { ...entity, nameHi: null };
}
