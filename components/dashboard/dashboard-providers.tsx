'use client';

import { PlanProvider } from '@/components/providers/plan-provider';

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return <PlanProvider>{children}</PlanProvider>;
}
