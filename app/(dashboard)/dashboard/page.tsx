export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { getUser } from '@/lib/auth/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, UtensilsCrossed, BarChart3 } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  let tenant = null;
  if (db) {
    try {
      const [t] = await db.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1);
      tenant = t;
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
      // If database query fails, redirect to onboarding or login
      redirect('/onboarding');
    }
  }

  if (!tenant) redirect('/onboarding');

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">Namaste, {tenant.name}!</h1>
      <p className="mt-1 text-text-muted">Aaj ka overview</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{tenant.plan}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Menu scans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-muted">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">Active</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-10 font-semibold">Quick actions</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Button variant="outline" className="h-auto flex-col gap-2 py-6" asChild>
          <Link href="/menu">
            <UtensilsCrossed className="h-6 w-6 text-brand" />
            Menu edit karein
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-6" asChild>
          <Link href="/qr">
            <QrCode className="h-6 w-6 text-brand" />
            QR download
          </Link>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 py-6" asChild>
          <Link href="/analytics">
            <BarChart3 className="h-6 w-6 text-brand" />
            Analytics dekhein
          </Link>
        </Button>
      </div>
    </div>
  );
}
