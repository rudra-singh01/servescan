import { Suspense } from 'react';
import { FullScreenLoader } from '@/components/shared/full-screen-loader';
import BillingPageContent from './billing-content';

export default function BillingPage() {
  return (
    <Suspense fallback={<FullScreenLoader label="Loading billing…" />}>
      <BillingPageContent />
    </Suspense>
  );
}
