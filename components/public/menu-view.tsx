'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatINR } from '@/lib/utils/format';
import { ItemImage } from '@/components/menu/item-image';
import { MenuLanguageSelect } from '@/components/public/menu-language-select';
import {
  menuHasHindiContent,
  resolveMenuLabels,
  type MenuDisplayLocale,
} from '@/lib/constants/menu-locale';

type Item = {
  id: string;
  name: string;
  nameHi?: string | null;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  isVeg: boolean | null;
  isAvailable: boolean;
  isFeatured: boolean;
};

type Category = {
  id: string;
  name: string;
  nameHi?: string | null;
  items: Item[];
};

type Props = {
  tenant: { name: string; logoUrl?: string | null };
  menu: { name: string; categories: Category[] };
  allUnavailable?: boolean;
  /** When false (free plan), Hindi is hidden and the language dropdown is not shown. */
  hindiMenuEnabled?: boolean;
};

export function MenuView({ tenant, menu, allUnavailable, hindiMenuEnabled = false }: Props) {
  const hasHindi = menuHasHindiContent(menu.categories);
  const showLanguageSelect = hindiMenuEnabled;
  const [locale, setLocale] = useState<MenuDisplayLocale>('en');

  useEffect(() => {
    if (hindiMenuEnabled && hasHindi) {
      setLocale('both');
    } else {
      setLocale('en');
    }
  }, [hindiMenuEnabled, hasHindi]);

  const displayLocale: MenuDisplayLocale = hindiMenuEnabled ? locale : 'en';
  const showHindiHint = hindiMenuEnabled && (locale === 'hi' || locale === 'both') && !hasHindi;

  const categoryAnchors = useMemo(
    () =>
      menu.categories.map((cat) => ({
        id: cat.id,
        href: `#cat-${cat.id}`,
        ...resolveMenuLabels(cat, displayLocale),
      })),
    [menu.categories, displayLocale],
  );

  if (allUnavailable) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-center">
        <p className="text-text-muted">
          Menu items are not available right now. Please ask staff for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface font-hindi">
      <header className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {tenant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            )}
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold truncate">{tenant.name}</h1>
              <p className="text-sm text-text-muted truncate">{menu.name}</p>
            </div>
          </div>
          {showLanguageSelect && (
            <MenuLanguageSelect
              value={locale}
              onChange={setLocale}
              className="shrink-0 flex-col items-start gap-1 sm:flex-row sm:items-center"
            />
          )}
        </div>
        {showHindiHint && (
          <p className="mx-auto mt-2 max-w-lg text-xs text-warning">
            No Hindi names yet — add them in Menu editor (Hindi fields under each item).
          </p>
        )}
      </header>

      <nav className="sticky top-[73px] z-10 overflow-x-auto border-b border-border bg-surface-alt px-4 py-2">
        <div className="mx-auto flex max-w-lg gap-2">
          {categoryAnchors.map((cat) => (
            <a
              key={cat.id}
              href={cat.href}
              className="shrink-0 rounded-full border border-border px-3 py-1 text-sm hover:border-brand"
            >
              {cat.primary}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24">
        {menu.categories.map((cat) => {
          const catLabels = resolveMenuLabels(cat, displayLocale);
          return (
            <section key={cat.id} id={`cat-${cat.id}`} className="mb-10 scroll-mt-32">
              <h2 className="font-display text-lg font-semibold">{catLabels.primary}</h2>
              {catLabels.secondary && (
                <p className="text-sm text-text-muted" lang="hi">
                  {catLabels.secondary}
                </p>
              )}
              <div className="mt-4 space-y-4">
                {cat.items.map((item) => {
                  const itemLabels = resolveMenuLabels(item, displayLocale);
                  return (
                    <article
                      key={item.id}
                      className={`overflow-hidden rounded-lg border border-border ${!item.isAvailable ? 'opacity-60' : ''}`}
                    >
                      <div className="flex gap-3 p-3 sm:gap-4">
                        <ItemImage imageUrl={item.imageUrl} alt={item.name} size="md" />
                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex gap-2">
                              {item.isVeg !== null && (
                                <span
                                  className={`mt-1 h-3 w-3 shrink-0 rounded-full border-2 ${item.isVeg ? 'border-veg' : 'border-nonveg'}`}
                                  title={item.isVeg ? 'Veg' : 'Non-veg'}
                                />
                              )}
                              <div>
                                <h3 className="line-clamp-2 font-medium">{itemLabels.primary}</h3>
                                {itemLabels.secondary && (
                                  <p className="text-sm text-text-muted" lang="hi">
                                    {itemLabels.secondary}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <p className="shrink-0 font-semibold text-brand">
                              {formatINR(item.price)}
                            </p>
                          </div>
                          {!item.isAvailable && (
                            <span className="mt-2 inline-block rounded bg-surface-alt px-2 py-0.5 text-xs text-text-muted">
                              Currently unavailable
                            </span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </div>
  );
}
