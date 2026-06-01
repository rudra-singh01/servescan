'use client';

import { MENU_LOCALE_OPTIONS, type MenuDisplayLocale } from '@/lib/constants/menu-locale';
import { cn } from '@/lib/utils/cn';

type Props = {
  value: MenuDisplayLocale;
  onChange: (value: MenuDisplayLocale) => void;
  className?: string;
};

export function MenuLanguageSelect({ value, onChange, className }: Props) {
  return (
    <label className={cn('flex items-center gap-2', className)}>
      <span className="text-xs font-medium text-text-muted">Menu language</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MenuDisplayLocale)}
        className="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        aria-label="Menu language"
      >
        {MENU_LOCALE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
