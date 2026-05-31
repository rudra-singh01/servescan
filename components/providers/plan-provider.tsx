'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Plan } from '@/lib/constants';
import { PLAN_LIMITS, type PlanLimits } from '@/lib/razorpay/plans';
import { billingUrlWithReason } from '@/lib/constants/billing';
import { useLoading } from '@/components/providers/loading-provider';

type PlanContextValue = {
  plan: Plan;
  isFree: boolean;
  limits: PlanLimits;
  planLoading: boolean;
  refreshPlan: () => Promise<void>;
  /** Redirect to billing — never shows a popup. */
  redirectToBilling: (limit?: string) => void;
  /** Returns true if the response was a plan limit (caller should stop). */
  handlePlanLimitResponse: (res: Response) => Promise<boolean>;
  /** Client-side guard: redirect if count is at or over plan max. */
  guardNumericLimit: (limitKey: 'menus' | 'itemsPerMenu' | 'categories' | 'qrCodes', current: number) => boolean;
  /** Client-side guard: redirect if boolean feature is disabled on current plan. */
  guardFeature: (feature: keyof PlanLimits) => boolean;
  /** fetch wrapper with optional loader + plan-limit redirect. */
  appFetch: (input: RequestInfo | URL, init?: RequestInit, options?: { loading?: boolean; label?: string }) => Promise<Response>;
};

const PlanContext = createContext<PlanContextValue | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { startLoading, stopLoading, withLoading } = useLoading();
  const [plan, setPlan] = useState<Plan>('free');
  const [planLoading, setPlanLoading] = useState(true);

  const refreshPlan = useCallback(async () => {
    const res = await fetch('/api/v1/billing/subscription');
    if (res.ok) {
      const { data } = await res.json();
      setPlan((data?.tenant?.plan as Plan) ?? 'free');
    }
  }, []);

  useEffect(() => {
    withLoading(async () => {
      await refreshPlan();
      setPlanLoading(false);
    }, 'Loading your account…').catch(() => setPlanLoading(false));
  }, [refreshPlan, withLoading]);

  const redirectToBilling = useCallback(
    (limit?: string) => {
      router.push(billingUrlWithReason(limit));
    },
    [router],
  );

  const handlePlanLimitResponse = useCallback(
    async (res: Response): Promise<boolean> => {
      if (res.status !== 402) return false;
      try {
        const body = await res.clone().json();
        if (body.error?.code === 'plan_limit_exceeded') {
          redirectToBilling(body.error.limit);
          return true;
        }
      } catch {
        // ignore parse errors
      }
      return false;
    },
    [redirectToBilling],
  );

  const guardNumericLimit = useCallback(
    (limitKey: 'menus' | 'itemsPerMenu' | 'categories' | 'qrCodes', current: number) => {
      const max = PLAN_LIMITS[plan][limitKey];
      if (typeof max === 'number' && current >= max) {
        redirectToBilling(limitKey);
        return true;
      }
      return false;
    },
    [plan, redirectToBilling],
  );

  const guardFeature = useCallback(
    (feature: keyof PlanLimits) => {
      const value = PLAN_LIMITS[plan][feature];
      if (typeof value === 'boolean' && !value) {
        redirectToBilling(feature);
        return true;
      }
      return false;
    },
    [plan, redirectToBilling],
  );

  const appFetch = useCallback(
    async (
      input: RequestInfo | URL,
      init?: RequestInit,
      options?: { loading?: boolean; label?: string },
    ) => {
      const showLoader = options?.loading !== false;
      if (showLoader) startLoading(options?.label);
      try {
        const res = await fetch(input, init);
        await handlePlanLimitResponse(res);
        return res;
      } finally {
        if (showLoader) stopLoading();
      }
    },
    [startLoading, stopLoading, handlePlanLimitResponse],
  );

  const value = useMemo(
    () => ({
      plan,
      isFree: plan === 'free',
      limits: PLAN_LIMITS[plan],
      planLoading,
      refreshPlan,
      redirectToBilling,
      handlePlanLimitResponse,
      guardNumericLimit,
      guardFeature,
      appFetch,
    }),
    [
      plan,
      planLoading,
      refreshPlan,
      redirectToBilling,
      handlePlanLimitResponse,
      guardNumericLimit,
      guardFeature,
      appFetch,
    ],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within PlanProvider');
  return ctx;
}

/** Redirect free / under-plan users away from Pro-only pages (no popup). */
export function usePlanGate(feature: keyof PlanLimits) {
  const { planLoading, guardFeature } = usePlan();

  useEffect(() => {
    if (planLoading) return;
    guardFeature(feature);
  }, [planLoading, guardFeature, feature]);
}
