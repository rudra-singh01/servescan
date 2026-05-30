'use client';

import { useEffect } from 'react';

type Props = {
  slug: string;
  menuId: string;
  tenantId: string;
  branchId: string;
};

export function ScanTracker({ slug, menuId, tenantId, branchId }: Props) {
  useEffect(() => {
    const sessionId =
      sessionStorage.getItem('scanserve_session') ??
      crypto.randomUUID?.() ??
      Math.random().toString(36);
    sessionStorage.setItem('scanserve_session', sessionId);

    const params = new URLSearchParams(window.location.search);
    fetch(`/api/v1/public/menu/${slug}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menuId,
        tenantId,
        branchId,
        tableNumber: params.get('t'),
        sessionId,
      }),
    }).catch(() => {});
  }, [slug, menuId, tenantId, branchId]);

  return null;
}
