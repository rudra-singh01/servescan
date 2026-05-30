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

export default function QrPage() {
  const [qrs, setQrs] = useState<QrRecord[]>([]);
  const [menus, setMenus] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/v1/qr')
      .then((r) => r.json())
      .then((d) => setQrs(d.data ?? []));
    fetch('/api/v1/menus')
      .then((r) => r.json())
      .then((d) => setMenus(d.data ?? []));
  }, []);

  const generate = async (menuId: string) => {
    const res = await fetch('/api/v1/qr/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuId }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setQrs((q) => [data, ...q]);
      toast.success('QR generate ho gaya!');
    } else {
      toast.error('QR generate nahi ho paya');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">QR Codes</h1>
      <p className="mt-1 text-text-muted">Table par print karne ke liye download karein</p>

      {menus.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {menus.map((m) => (
            <Button key={m.id} onClick={() => generate(m.id)}>
              {m.name} — QR banayein
            </Button>
          ))}
        </div>
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
                <Image src={qr.imageUrl} alt="QR" width={200} height={200} unoptimized />
              )}
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
