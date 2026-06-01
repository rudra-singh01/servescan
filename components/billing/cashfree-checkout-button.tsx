'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLoading } from '@/components/providers/loading-provider';
import type { Plan } from '@/lib/constants';

type CashfreeSdk = {
  checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => void;
};

declare global {
  interface Window {
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => CashfreeSdk;
  }
}

async function loadCashfreeSdk(mode: 'sandbox' | 'production'): Promise<CashfreeSdk> {
  if (typeof window === 'undefined') {
    throw new Error('Cashfree checkout is only available in the browser');
  }

  if (window.Cashfree) {
    return window.Cashfree({ mode });
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-cashfree-sdk]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Cashfree SDK')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.dataset.cashfreeSdk = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.body.appendChild(script);
  });

  if (!window.Cashfree) {
    throw new Error('Cashfree SDK failed to initialize');
  }

  return window.Cashfree({ mode });
}

type Props = {
  plan: Exclude<Plan, 'free'>;
  variant?: 'default' | 'outline';
  className?: string;
  label?: string;
  onSuccess?: () => void;
};

export function CashfreeCheckoutButton({
  plan,
  variant = 'default',
  className,
  label = 'Upgrade',
  onSuccess,
}: Props) {
  const { withLoading } = useLoading();
  const [busy, setBusy] = useState(false);

  const startCheckout = async () => {
    setBusy(true);
    try {
      await withLoading(async () => {
        const res = await fetch('/api/v1/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        });

        const body = await res.json();

        if (!res.ok) {
          const msg =
            body.error?.message ??
            (typeof body.error === 'string' ? body.error : 'Could not start checkout');
          toast.error(msg);
          return;
        }

        const { paymentSessionId, cashfreeMode } = body.data as {
          paymentSessionId: string;
          cashfreeMode: 'sandbox' | 'production';
        };

        const cashfree = await loadCashfreeSdk(cashfreeMode);
        cashfree.checkout({
          paymentSessionId,
          redirectTarget: '_self',
        });
        onSuccess?.();
      }, 'Redirecting to Cashfree…');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Payment could not be started');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      className={className}
      size="sm"
      variant={variant}
      disabled={busy}
      onClick={startCheckout}
    >
      {busy ? 'Please wait…' : label}
    </Button>
  );
}
