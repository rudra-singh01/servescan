'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UtensilsCrossed,
  QrCode,
  ShoppingBag,
  BarChart3,
  Settings,
  Building2,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/qr', label: 'QR Codes', icon: QrCode },
  { href: '/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/branches', label: 'Branches', icon: Building2 },
  { href: '/settings/profile', label: 'Settings', icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-border bg-surface md:block">
        <div className="p-4 font-display text-xl font-bold text-brand">ScanServe</div>
        <nav className="space-y-1 px-2">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                pathname.startsWith(href)
                  ? 'bg-brand-light text-brand-dark font-medium'
                  : 'text-text-muted hover:bg-surface-alt',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-surface md:hidden">
        {nav.slice(0, 5).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2 text-xs',
              pathname.startsWith(href) ? 'text-brand' : 'text-text-muted',
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
