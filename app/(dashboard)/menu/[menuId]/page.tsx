'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { MenuEditor, type EditorCategory } from '@/components/menu/menu-editor';
import { LogoutButton } from '@/components/auth/logout-button';
import { useLoading } from '@/components/providers/loading-provider';
import { usePlan } from '@/components/providers/plan-provider';

export default function MenuEditorPage() {
  const { menuId } = useParams<{ menuId: string }>();
  const { withLoading } = useLoading();
  const { planLoading, appFetch, limits, refreshPlan } = usePlan();
  const [menuName, setMenuName] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [categories, setCategories] = useState<EditorCategory[]>([]);
  const [pageReady, setPageReady] = useState(false);

  const loadMenu = useCallback(async () => {
    await withLoading(async () => {
      const [menuRes, subRes] = await Promise.all([
        appFetch(`/api/v1/menus/${menuId}`, undefined, { loading: false }),
        appFetch('/api/v1/billing/subscription', undefined, { loading: false }),
      ]);
      if (subRes.ok) {
        const sub = await subRes.json();
        setTenantSlug(sub.data?.tenant?.slug ?? '');
      }
      if (menuRes.ok) {
        const { data } = await menuRes.json();
        setMenuName(data.name);
        setCategories(
          data.categories.map((c: EditorCategory) => ({
            id: c.id,
            name: c.name,
            nameHi: c.nameHi,
            items: c.items.map((i: EditorCategory['items'][0]) => ({
              id: i.id,
              name: i.name,
              nameHi: i.nameHi,
              price: i.price,
              imageUrl: i.imageUrl,
              isAvailable: i.isAvailable,
              isVeg: i.isVeg,
            })),
          })),
        );
      }
      await refreshPlan();
      setPageReady(true);
    }, 'Loading menu…');
  }, [menuId, withLoading, appFetch, refreshPlan]);

  useEffect(() => {
    if (!planLoading) loadMenu();
  }, [planLoading, loadMenu]);

  const activateMenu = async () => {
    const res = await appFetch(`/api/v1/menus/${menuId}/activate`, { method: 'POST' });
    if (res.ok) {
      toast.success('Menu published — guests can view it now!');
      loadMenu();
    } else if (res.status !== 402) {
      const err = await res.json();
      toast.error(
        typeof err.error === 'object' && err.error?.message
          ? err.error.message
          : 'Add at least one item first',
      );
    }
  };

  if (planLoading || !pageReady) {
    return null;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold">{menuName}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={activateMenu}>
            Publish menu
          </Button>
          {tenantSlug && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/m/${tenantSlug}?preview=true`} target="_blank" rel="noopener noreferrer">
                Preview{limits.hindiMenu ? ' (language switcher)' : ''}
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/menu">Back</Link>
          </Button>
          <LogoutButton variant="ghost" size="sm" />
        </div>
      </div>

      <div className="mt-6">
        <MenuEditor menuId={menuId} categories={categories} onRefresh={loadMenu} />
      </div>
    </div>
  );
}
