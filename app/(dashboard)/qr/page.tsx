'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useLoading } from '@/components/providers/loading-provider';
import { usePlan } from '@/components/providers/plan-provider';

type QrRecord = {
  id: string;
  url: string;
  imageUrl?: string;
  tableNumber?: string;
};

function getSiteOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export default function QrPage() {
  const { withLoading } = useLoading();
  const { planLoading, appFetch, guardNumericLimit, isFree } = usePlan();
  const [qrs, setQrs] = useState<QrRecord[]>([]);
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);
  const [pageReady, setPageReady] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingMenuId, setGeneratingMenuId] = useState<string | null>(null);

  const loadQrs = useCallback(async () => {
    const res = await appFetch('/api/v1/qr', undefined, { loading: false });
    const body = await res.json();
    if (res.ok) setQrs(body.data ?? []);
  }, [appFetch]);

  const loadPage = useCallback(async () => {
    await withLoading(async () => {
      await loadQrs();
      const menusRes = await appFetch('/api/v1/menus', undefined, { loading: false });
      const menusBody = await menusRes.json();
      if (menusRes.ok) setMenus(menusBody.data ?? []);
      setPageReady(true);
    }, 'Loading QR codes…');
  }, [withLoading, loadQrs, appFetch]);

  useEffect(() => {
    if (!planLoading) loadPage();
  }, [planLoading, loadPage]);

  const generate = async (menuId: string) => {
    if (guardNumericLimit('qrCodes', qrs.length)) return;

    setGeneratingMenuId(menuId);
    try {
      const res = await appFetch('/api/v1/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId, baseUrl: getSiteOrigin() }),
      });
      const body = await res.json();
      if (res.ok) {
        setQrs((q) => [body.data, ...q]);
        toast.success('QR code generated');
      } else if (res.status !== 402) {
        toast.error('Could not generate QR code');
      }
    } catch {
      toast.error('Could not generate QR code');
    } finally {
      setGeneratingMenuId(null);
    }
  };

  const regenerateAll = async () => {
    setRegenerating(true);
    try {
      const res = await appFetch('/api/v1/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: getSiteOrigin() }),
      });
      const body = await res.json();

      if (!res.ok) {
        if (res.status !== 402) toast.error('Could not regenerate QR codes');
        return;
      }

      const codes = body.data?.codes ?? body.data;
      if (Array.isArray(codes) && codes.length > 0) {
        setQrs(codes);
      } else {
        await loadQrs();
      }

      const count = body.data?.updated ?? (Array.isArray(codes) ? codes.length : 0);
      if (count === 0) {
        toast.message('No QR codes to update', {
          description: 'Generate a QR code for your menu first.',
        });
      } else {
        toast.success(`Updated ${count} QR code${count === 1 ? '' : 's'} with your live URL`);
      }
    } catch {
      toast.error('Could not regenerate QR codes');
    } finally {
      setRegenerating(false);
    }
  };

  if (planLoading || !pageReady) return null;

  const hasLocalhost = qrs.some((q) => q.url?.includes('localhost'));

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">QR Codes</h1>
      <p className="mt-1 text-text-muted">
        Download and print QR codes for your tables
        {isFree && (
          <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark">
            Free plan: 1 QR code
          </span>
        )}
      </p>

      {hasLocalhost && (
        <div className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
          <p className="font-medium">Some QR codes still point to localhost.</p>
          <p className="mt-1 text-text-muted">
            They were likely created on your computer. Regenerate them to use your live site URL.
          </p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={regenerateAll}
            disabled={regenerating}
          >
            {regenerating ? 'Updating…' : 'Fix URLs — regenerate all'}
          </Button>
        </div>
      )}

      {qrs.length > 0 && (
        <Button
          className="mt-4"
          variant="outline"
          size="sm"
          onClick={regenerateAll}
          disabled={regenerating}
        >
          {regenerating ? 'Regenerating…' : 'Regenerate all QR codes'}
        </Button>
      )}

      {menus.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {menus.map((m) => (
            <Button
              key={m.id}
              onClick={() => generate(m.id)}
              disabled={generatingMenuId === m.id || regenerating}
            >
              {generatingMenuId === m.id ? 'Generating…' : `Generate QR — ${m.name}`}
            </Button>
          ))}
        </div>
      )}

      {qrs.length === 0 && (
        <p className="mt-8 text-center text-text-muted">
          No QR codes yet. Pick a menu above to generate your first one.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {qrs.map((qr) => (
          <Card key={qr.id}>
            <CardHeader>
              <CardTitle className="text-sm">
                {qr.tableNumber ? `Table ${qr.tableNumber}` : 'General QR'}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-3">
              {qr.imageUrl && (
                <Image src={qr.imageUrl} alt="QR code" width={200} height={200} unoptimized />
              )}
              <p className="w-full break-all text-center text-xs text-text-muted">{qr.url}</p>
              {qr.imageUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={qr.imageUrl} download={`qr-${qr.id}.png`}>
                    Download PNG
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
