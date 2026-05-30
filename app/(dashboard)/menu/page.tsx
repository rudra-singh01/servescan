export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as menuService from '@/lib/services/menu.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default async function MenuListPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  if (!db) redirect('/login');

  const [tenant] = await db.select().from(tenants).where(eq(tenants.ownerId, user.id)).limit(1);
  if (!tenant) redirect('/onboarding');

  const menus = await menuService.listMenus(tenant.id);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Menus</h1>
        <Button asChild>
          <Link href="/menu/new">
            <Plus className="h-4 w-4" />
            Naya menu
          </Link>
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        {menus.length === 0 ? (
          <p className="text-text-muted">Abhi koi menu nahi. Pehla menu banayein!</p>
        ) : (
          menus.map((menu) => (
            <Card key={menu.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{menu.name}</CardTitle>
                {menu.isActive && (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                    Active
                  </span>
                )}
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/menu/${menu.id}`}>Edit</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/m/${tenant.slug}?preview=true`} target="_blank">
                    Preview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
