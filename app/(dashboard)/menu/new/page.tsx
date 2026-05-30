'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NewMenuPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    const res = await fetch('/api/v1/menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    setLoading(false);
    if (res.ok) {
      const { data } = await res.json();
      router.push(`/menu/${data.id}`);
    } else {
      const err = await res.json();
      toast.error(err.error?.code === 'plan_limit_exceeded' ? 'Plan limit reached — upgrade' : 'Create failed');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>New menu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Menu naam</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lunch Menu" />
          </div>
          <Button onClick={create} disabled={loading || !name}>
            Banayein
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
