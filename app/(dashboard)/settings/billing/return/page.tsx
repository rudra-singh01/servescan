'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FullScreenLoader } from '@/components/shared/full-screen-loader';
import { useLoading } from '@/components/providers/loading-provider';
import { usePlan } from '@/components/providers/plan-provider';

function BillingReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('order_id');
  const { withLoading } = useLoading();
  const { refreshPlan } = usePlan();
  const [status, setStatus] = useState<'loading' | 'paid' | 'pending' | 'error'>('loading');
  const [planName, setPlanName] = useState<string>('');

  useEffect(() => {
    if (!orderId) {
      setStatus('error');
      return;
    }

    withLoading(async () => {
      const res = await fetch(`/api/v1/billing/verify?order_id=${encodeURIComponent(orderId)}`);
      const body = await res.json();

      if (!res.ok) {
        setStatus('error');
        return;
      }

      setPlanName(body.data?.plan ?? '');
      setStatus(body.data?.status === 'paid' ? 'paid' : 'pending');
      await refreshPlan();
    }, 'Confirming payment…');
  }, [orderId, withLoading, refreshPlan]);

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Payment status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <p className="text-sm text-text-muted">Confirming your payment with Cashfree…</p>
          )}
          {status === 'paid' && (
            <>
              <p className="text-success font-medium">Payment successful!</p>
              <p className="text-sm text-text-muted">
                Your <strong className="capitalize">{planName}</strong> plan is now active.
              </p>
              <Button onClick={() => router.push('/dashboard')}>Go to dashboard</Button>
            </>
          )}
          {status === 'pending' && (
            <>
              <p className="text-sm text-text-muted">
                Payment is still processing. Refresh this page in a minute or check your email from
                Cashfree.
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh status
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-sm text-text-muted">
                We could not verify this payment. If money was deducted, contact support with your
                order ID.
              </p>
              {orderId && (
                <p className="font-mono text-xs break-all text-text-muted">Order: {orderId}</p>
              )}
              <Button variant="outline" asChild>
                <Link href="/settings/billing">Back to billing</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function BillingReturnPage() {
  return (
    <Suspense fallback={<FullScreenLoader label="Loading…" />}>
      <BillingReturnContent />
    </Suspense>
  );
}
