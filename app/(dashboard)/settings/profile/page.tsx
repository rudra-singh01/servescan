'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');

  const save = async () => {
    toast.success('Profile saved (connect API for persistence)');
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
      <Card className="mt-6 max-w-lg">
        <CardHeader>
          <CardTitle>Restaurant details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <Button onClick={save}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
}
