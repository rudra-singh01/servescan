import type { Plan } from '@/lib/constants';

export interface PlanLimits {
  menus: number;
  itemsPerMenu: number;
  categories: number;
  qrCodes: number;
  tableOrdering: boolean;
  hindiMenu: boolean;
  customBranding: boolean;
  orderAlerts: boolean;
  analyticsDays: number;
  teamMembers: number;
  branches: number;
  upiPayments: boolean;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    menus: 1,
    itemsPerMenu: 20,
    categories: 3,
    qrCodes: 1,
    tableOrdering: false,
    hindiMenu: false,
    customBranding: false,
    orderAlerts: false,
    analyticsDays: 7,
    teamMembers: 1,
    branches: 1,
    upiPayments: false,
    prioritySupport: false,
  },
  starter: {
    menus: 3,
    itemsPerMenu: Infinity,
    categories: 10,
    qrCodes: 5,
    tableOrdering: false,
    hindiMenu: true,
    customBranding: true,
    orderAlerts: false,
    analyticsDays: 30,
    teamMembers: 2,
    branches: 1,
    upiPayments: false,
    prioritySupport: false,
  },
  pro: {
    menus: 10,
    itemsPerMenu: Infinity,
    categories: Infinity,
    qrCodes: 20,
    tableOrdering: true,
    hindiMenu: true,
    customBranding: true,
    orderAlerts: true,
    analyticsDays: 90,
    teamMembers: 5,
    branches: 3,
    upiPayments: false,
    prioritySupport: true,
  },
  business: {
    menus: Infinity,
    itemsPerMenu: Infinity,
    categories: Infinity,
    qrCodes: Infinity,
    tableOrdering: true,
    hindiMenu: true,
    customBranding: true,
    orderAlerts: true,
    analyticsDays: 365,
    teamMembers: 20,
    branches: 10,
    upiPayments: true,
    prioritySupport: true,
  },
};

export const PLAN_PRICES: Record<Exclude<Plan, 'free'>, number> = {
  starter: 499,
  pro: 999,
  business: 2499,
};

/** Check if current count is within plan limit. */
export function isWithinLimit(plan: Plan, limitKey: keyof PlanLimits, current: number): boolean {
  const limits = PLAN_LIMITS[plan];
  const max = limits[limitKey];
  if (typeof max !== 'number') return true;
  return current < max;
}
