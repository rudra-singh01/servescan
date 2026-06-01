import { notFound } from 'next/navigation';
import { MenuView } from '@/components/public/menu-view';
import { ScanTracker } from '@/components/public/scan-tracker';
import * as menuService from '@/lib/services/menu.service';
import { db } from '@/lib/db';
import { canUseHindiMenu } from '@/lib/plan/hindi-menu';
import { normalizePlan } from '@/lib/plan/normalize';

export const revalidate = 60;

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  if (!db) {
    notFound();
  }

  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === 'true';

  try {
    const { tenant, menu, allUnavailable } = await menuService.getPublicMenu(slug, isPreview);

    const hindiMenuEnabled = canUseHindiMenu(normalizePlan(tenant.plan));

    return (
      <>
        <MenuView
          tenant={tenant}
          menu={menu}
          allUnavailable={allUnavailable}
          hindiMenuEnabled={hindiMenuEnabled}
        />
        <ScanTracker slug={slug} menuId={menu.id} tenantId={tenant.id} branchId={menu.branchId} />
      </>
    );
  } catch {
    notFound();
  }
}
