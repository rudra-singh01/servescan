export type MenuDisplayLocale = 'en' | 'hi' | 'both';

export const MENU_LOCALE_OPTIONS: { value: MenuDisplayLocale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'both', label: 'English + Hindi' },
];

type Named = { name: string; nameHi?: string | null };

/** Resolve category/item titles for the selected menu language. */
export function resolveMenuLabels(
  entity: Named,
  locale: MenuDisplayLocale,
): { primary: string; secondary: string | null } {
  const en = entity.name;
  const hi = entity.nameHi?.trim() || null;

  if (locale === 'en') {
    return { primary: en, secondary: null };
  }
  if (locale === 'hi') {
    return { primary: hi ?? en, secondary: null };
  }
  return { primary: en, secondary: hi };
}

export function menuHasHindiContent(categories: { nameHi?: string | null; items: { nameHi?: string | null }[] }[]) {
  return categories.some(
    (c) =>
      Boolean(c.nameHi?.trim()) || c.items.some((i) => Boolean(i.nameHi?.trim())),
  );
}
