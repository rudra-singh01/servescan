import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function MenuNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-alt p-8 text-center">
      <h1 className="font-display text-2xl font-bold text-brand">ScanServe</h1>
      <p className="mt-4 text-text-muted">
        Yeh menu abhi available nahi hai. Kripya restaurant se QR code dubara maangein.
      </p>
      <Button className="mt-8" asChild>
        <Link href="/">Home</Link>
      </Button>
    </div>
  );
}
