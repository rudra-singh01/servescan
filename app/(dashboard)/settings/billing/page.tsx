'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatINR } from '@/lib/utils/format';
import { PLAN_LIMITS, PLAN_PRICES } from '@/lib/razorpay/plans';
import type { Plan } from '@/lib/constants';
import { Check } from 'lucide-react';

const PLAN_ORDER: Plan[] = ['free', 'starter', 'pro', 'business'];

const FEATURE_LABELS: { key: keyof (typeof PLAN_LIMITS)['free']; label: string }[] = [
  { key: 'menus', label: 'Menus' },
  { key: 'itemsPerMenu', label: 'Items per menu' },
  { key: 'categories', label: 'Categories' },
  { key: 'qrCodes', label: 'QR codes' },
  { key: 'hindiMenu', label: 'Hindi menu' },
  { key: 'tableOrdering', label: 'Table ordering' },
  { key: 'orderAlerts', label: 'Order alerts' },
];

function formatLimit(value: number | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : '—';
  return value === Infinity ? 'Unlimited' : String(value);
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/billing/subscription')
      .then((r) => r.json())
      .then((d) => {
        setCurrentPlan((d.data?.tenant?.plan as Plan) ?? 'free');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl font-bold">Billing & Plans</h1>
      <p className="mt-1 text-text-muted">
        Manage your plan — free includes 1 menu, 20 items, and default images
      </p>

      {!loading && (
        <Card className="mt-6 border-brand bg-brand-light/30">
          <CardContent className="py-4">
            <p className="text-sm">
              Current plan:{' '}
              <strong className="capitalize text-brand-dark">{currentPlan}</strong>
            </p>
          </CardContent>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((planId) => {
          const limits = PLAN_LIMITS[planId];
          const price = planId === 'free' ? 0 : PLAN_PRICES[planId as keyof typeof PLAN_PRICES];
          const isCurrent = currentPlan === planId;

          return (
            <Card
              key={planId}
              className={isCurrent ? 'border-2 border-brand shadow-md' : 'border-border'}
            >
              <CardHeader className="pb-2">
                <CardTitle className="capitalize text-lg">{planId}</CardTitle>
                {isCurrent && (
                  <span className="text-xs font-medium text-brand">Current plan</span>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold">
                  {price === 0 ? 'Free' : formatINR(price)}
                  {price > 0 && <span className="text-sm font-normal text-text-muted">/mo</span>}
                </p>
                <ul className="space-y-2 text-sm text-text-muted">
                  {FEATURE_LABELS.map(({ key, label }) => (
                    <li key={key} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                      <span>
                        {label}: <strong className="text-text-primary">{formatLimit(limits[key])}</strong>
                      </span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 shrink-0 text-success" />
                    Item photos:{' '}
                    <strong className="text-text-primary">
                      {planId === 'free' ? 'Default only' : 'Upload'}
                    </strong>
                  </li>
                </ul>
                {planId !== 'free' && !isCurrent && (
                  <Button className="w-full" size="sm" variant={planId === 'pro' ? 'default' : 'outline'}>
                    Upgrade
                  </Button>
                )}
                {planId === 'free' && !isCurrent && (
                  <Button className="w-full" size="sm" variant="outline" disabled>
                    Downgrade
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Free plan tips</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-text-muted space-y-2">
          <p>· 1 menu, 3 categories, 20 items — works with any template</p>
          <p>· Items use a default image until you upgrade for uploads</p>
          <p>· Upgrade to Starter or Pro for more menus and photo uploads</p>
          <Button variant="link" className="h-auto p-0 text-brand" asChild>
            <Link href="/menu">Open menu editor</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
