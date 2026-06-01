'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Props = {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showIcon?: boolean;
};

export function LogoutButton({
  variant = 'outline',
  size = 'sm',
  className,
  showIcon = true,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('inline-flex items-center gap-2', className)}
      disabled={loading}
      onClick={logout}
    >
      {showIcon && <LogOut className="h-4 w-4 shrink-0" />}
      {loading ? 'Signing out…' : 'Log out'}
    </Button>
  );
}
