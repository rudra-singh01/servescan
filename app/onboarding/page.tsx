'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MENU_TEMPLATES } from '@/lib/constants';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import Image from 'next/image';

const WIZARD_KEY = 'scanserve_onboarding';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    cuisineTypes: [] as string[],
    template: 'indian' as string,
  });
  const [qrData, setQrData] = useState<{ imageUrl?: string; url?: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(WIZARD_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setForm((f) => ({ ...f, ...parsed.form }));
        setStep(parsed.step ?? 1);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WIZARD_KEY, JSON.stringify({ form, step }));
  }, [form, step]);

  const isValidPhone = () => /^[6-9]\d{9}$/.test(form.phone);

  const createTenant = async () => {
    // Validate before submission
    if (!form.name.trim()) {
      toast.error('Restaurant ka naam likho');
      return;
    }
    if (!isValidPhone()) {
      toast.error('10-digit mobile number likho jo 6, 7, 8, ya 9 se shuru ho');
      return;
    }
    if (!form.city.trim()) {
      toast.error('Shehar likho');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/v1/onboarding/tenant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        city: form.city,
        cuisineTypes: form.cuisineTypes,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json();
      const errorMsg = err?.error?.message || 'Kuch galat ho gaya. Phir se try karo';
      toast.error(errorMsg);
      return;
    }
    setStep(2);
  };

  const createMenu = async () => {
    setLoading(true);
    const res = await fetch('/api/v1/onboarding/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template: form.template }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('Menu create nahi ho paya');
      return;
    }
    const { data: menu } = await res.json();
    setStep(3);
    await generateQr(menu.id);
  };

  const generateQr = async (menuId: string) => {
    const res = await fetch('/api/v1/qr/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menuId }),
    });
    if (res.ok) {
      const { data } = await res.json();
      setQrData(data);
    }
  };

  const finish = () => {
    localStorage.removeItem(WIZARD_KEY);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  return (
    <div className="min-h-screen bg-surface-alt p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full ${step >= s ? 'bg-brand' : 'bg-border'}`}
            />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display">
              {step === 1 && 'Restaurant details'}
              {step === 2 && 'Apna pehla menu'}
              {step === 3 && 'Aapka QR code ready hai!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Restaurant ka naam</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Sharma Ji ka Dhaba"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                    }
                    placeholder="9876543210"
                    className={form.phone && !isValidPhone() ? 'border-error' : ''}
                  />
                  <p className={`text-xs ${form.phone && !isValidPhone() ? 'text-error' : 'text-text-muted'}`}>
                    {form.phone && !isValidPhone()
                      ? '❌ 10-digit number jo 6, 7, 8, ya 9 se shuru ho'
                      : '✓ 10-digit number jo 6, 7, 8, ya 9 se shuru ho'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Shehar</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Delhi"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={createTenant} 
                  disabled={loading || !form.name.trim() || !isValidPhone() || !form.city.trim()}
                >
                  Aage badhein
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-sm text-text-muted">Template choose karein ya blank se shuru karein</p>
                <div className="grid grid-cols-2 gap-2">
                  {MENU_TEMPLATES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, template: t })}
                      className={`rounded-lg border p-3 text-sm capitalize ${
                        form.template === t ? 'border-brand bg-brand-light' : 'border-border'
                      }`}
                    >
                      {t.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                <Button className="w-full" onClick={createMenu} disabled={loading}>
                  Menu banayein
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                {qrData?.imageUrl && (
                  <div className="flex justify-center">
                    <Image src={qrData.imageUrl} alt="QR Code" width={256} height={256} unoptimized />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {qrData?.imageUrl && (
                    <Button asChild variant="outline">
                      <a href={qrData.imageUrl} download="scanserve-qr.png">
                        PNG Download
                      </a>
                    </Button>
                  )}
                  {qrData?.url && (
                    <Button asChild variant="outline">
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Menu dekhein: ${qrData.url}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        WhatsApp par bhejein
                      </a>
                    </Button>
                  )}
                  <Button className="w-full" onClick={finish}>
                    Dashboard par jayein
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
