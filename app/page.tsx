import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QrCode, Smartphone, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-alt">
      <header className="border-b border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-display text-2xl font-bold text-brand">ScanServe</span>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started — Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
          Digital menus with QR codes,
          <br />
          <span className="text-brand">ready in 10 minutes</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-text-muted">
          Built for Indian restaurants — no app download for guests, just scan and browse.
          Manage your full menu from your phone.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/signup">Create a free account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Already have an account?</Link>
          </Button>
        </div>

        <div className="mt-20 grid gap-8 sm:grid-cols-3">
          {[
            {
              icon: Smartphone,
              title: 'Mobile-first',
              desc: 'Manage your entire menu from your phone',
            },
            {
              icon: QrCode,
              title: 'Print-ready QR',
              desc: 'Download PNGs to print for each table',
            },
            {
              icon: Zap,
              title: 'Fast on slow networks',
              desc: 'Guests get an instant menu load, even on 2G',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-surface p-6 text-left">
              <Icon className="h-8 w-8 text-brand" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-text-muted">
        <Link href="/privacy" className="hover:text-brand">
          Privacy
        </Link>
        {' · '}
        <Link href="/terms" className="hover:text-brand">
          Terms
        </Link>
      </footer>
    </div>
  );
}
