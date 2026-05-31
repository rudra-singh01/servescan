'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { usePlan } from '@/components/providers/plan-provider';

export default function NewMenuPage() {
  const router = useRouter();
  const { appFetch, guardNumericLimit, planLoading } = usePlan();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [menuCount, setMenuCount] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (planLoading) return;
    appFetch('/api/v1/menus', undefined, { loading: false }).then(async (res) => {
      const body = await res.json();
      const count = body.data?.length ?? 0;
      setMenuCount(count);
      guardNumericLimit('menus', count);
      setChecked(true);
    });
  }, [planLoading, appFetch, guardNumericLimit]);

  const create = async () => {
    if (guardNumericLimit('menus', menuCount)) return;

    setSubmitting(true);
    const res = await appFetch('/api/v1/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setSubmitting(false);

    if (res.ok) {
      const { data } = await res.json();
      router.push(`/menu/${data.id}`);
    } else if (res.status !== 402) {
      toast.error('Could not create menu');
    }
  };

  if (planLoading || !checked) return null;

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>New menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Menu name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lunch Menu" />
          </div>
          <Button onClick={create} disabled={submitting || !name}>
            Create menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
