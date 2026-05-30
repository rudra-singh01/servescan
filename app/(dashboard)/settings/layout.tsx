'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/billing', label: 'Billing' },
  { href: '/settings/team', label: 'Team' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-4 md:p-8">
      <nav className="mb-6 flex gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              pathname.startsWith(tab.href)
                ? 'bg-brand-light text-brand-dark'
                : 'text-text-muted hover:bg-surface-alt',
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
