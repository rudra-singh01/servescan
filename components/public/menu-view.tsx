import { formatINR } from '@/lib/utils/format';
import { ItemImage } from '@/components/menu/item-image';

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
};

export function MenuView({ tenant, menu, allUnavailable }: Props) {
  if (allUnavailable) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8 text-center">
        <p className="text-text-muted">
          Menu items abhi available nahi hain. Kripya staff se poochhein.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 border-b border-border bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          {tenant.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
          )}
          <div>
            <h1 className="font-display text-xl font-bold">{tenant.name}</h1>
            <p className="text-sm text-text-muted">{menu.name}</p>
          </div>
        </div>
      </header>

      <nav className="sticky top-[73px] z-10 overflow-x-auto border-b border-border bg-surface-alt px-4 py-2">
        <div className="mx-auto flex max-w-lg gap-2">
          {menu.categories.map((cat) => (
            <a
              key={cat.id}
              href={`#${cat.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="shrink-0 rounded-full border border-border px-3 py-1 text-sm hover:border-brand"
            >
              {cat.name}
            </a>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24">
        {menu.categories.map((cat) => (
          <section
            key={cat.id}
            id={cat.name.toLowerCase().replace(/\s+/g, '-')}
            className="mb-10 scroll-mt-32"
          >
            <h2 className="font-display text-lg font-semibold">{cat.name}</h2>
            {cat.nameHi && <p className="text-sm text-text-muted">{cat.nameHi}</p>}
            <div className="mt-4 space-y-4">
              {cat.items.map((item) => (
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
                            <h3 className="line-clamp-2 font-medium">{item.name}</h3>
                            {item.nameHi && (
                              <p className="text-sm text-text-muted">{item.nameHi}</p>
                            )}
                            {item.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-text-muted">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="shrink-0 font-semibold text-brand">{formatINR(item.price)}</p>
                      </div>
                      {!item.isAvailable && (
                        <span className="mt-2 inline-block rounded bg-surface-alt px-2 py-0.5 text-xs text-text-muted">
                          Currently unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
