'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

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

async function readApiError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.error === 'string') return body.error;
    if (body.error?.message && typeof body.error.message === 'string') return body.error.message;
    if (body.error?.code) return String(body.error.code);
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

export default function QrPage() {
  const [qrs, setQrs] = useState<QrRecord[]>([]);
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingMenuId, setGeneratingMenuId] = useState<string | null>(null);

  const loadQrs = async () => {
    const res = await fetch('/api/v1/qr');
    const body = await res.json();
    if (res.ok) {
      setQrs(body.data ?? []);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadQrs();
      const menusRes = await fetch('/api/v1/menus');
      const menusBody = await menusRes.json();
      if (menusRes.ok) setMenus(menusBody.data ?? []);
      setLoading(false);
    })();
  }, []);

  const generate = async (menuId: string) => {
    setGeneratingMenuId(menuId);
    try {
      const res = await fetch('/api/v1/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuId, baseUrl: getSiteOrigin() }),
      });
      const body = await res.json();
      if (res.ok) {
        setQrs((q) => [body.data, ...q]);
        toast.success('QR code generated');
      } else {
        toast.error(await readApiError(res));
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
      const res = await fetch('/api/v1/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseUrl: getSiteOrigin() }),
      });
      const body = await res.json();

      if (!res.ok) {
        toast.error(await readApiError(res));
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

  const hasLocalhost = qrs.some((q) => q.url?.includes('localhost'));

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">QR Codes</h1>
      <p className="mt-1 text-text-muted">Download and print QR codes for your tables</p>

      {loading && <p className="mt-4 text-sm text-text-muted">Loading…</p>}

      {!loading && hasLocalhost && (
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

      {!loading && qrs.length > 0 && (
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

      {!loading && menus.length > 0 && (
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

      {!loading && qrs.length === 0 && (
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
