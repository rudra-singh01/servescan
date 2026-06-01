'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ItemImageUpload } from '@/components/menu/item-image-upload';
import { formatINR } from '@/lib/utils/format';
import { canUploadItemImages } from '@/lib/constants/menu';
import { PLAN_LIMITS } from '@/lib/razorpay/plans';
import { usePlan } from '@/components/providers/plan-provider';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

export type EditorItem = {
  id: string;
  name: string;
  nameHi?: string | null;
  price: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  isVeg: boolean | null;
};

export type EditorCategory = {
  id: string;
  name: string;
  nameHi?: string | null;
  items: EditorItem[];
};

type ItemDraft = { name: string; nameHi: string; price: string; isVeg: string };

type Props = {
  menuId: string;
  categories: EditorCategory[];
  onRefresh: () => void;
};

export function MenuEditor({ menuId, categories, onRefresh }: Props) {
  const { plan, guardNumericLimit, redirectToBilling, appFetch } = usePlan();
  const limits = PLAN_LIMITS[plan];
  const totalItems = categories.reduce((n, c) => n + c.items.length, 0);
  const allowImages = canUploadItemImages(plan);
  const hindiEnabled = limits.hindiMenu;
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryNameHi, setNewCategoryNameHi] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [itemDrafts, setItemDrafts] = useState<Record<string, ItemDraft>>({});
  const [hindiDrafts, setHindiDrafts] = useState<Record<string, string>>({});
  const [savingHindi, setSavingHindi] = useState<string | null>(null);

  const getDraft = (categoryId: string): ItemDraft =>
    itemDrafts[categoryId] ?? { name: '', nameHi: '', price: '', isVeg: 'veg' };

  const setDraft = (categoryId: string, patch: Partial<ItemDraft>) => {
    setItemDrafts((d) => ({
      ...d,
      [categoryId]: { ...getDraft(categoryId), ...patch },
    }));
  };

  const getHindiDraft = (key: string, fallback = '') =>
    key in hindiDrafts ? hindiDrafts[key] : fallback;

  const setHindiDraft = (key: string, value: string) => {
    setHindiDrafts((d) => ({ ...d, [key]: value }));
  };

  const saveCategoryHindi = async (categoryId: string, nameHi: string, previous: string) => {
    if (!hindiEnabled) {
      redirectToBilling('hindiMenu');
      return;
    }
    const trimmed = nameHi.trim();
    if (trimmed === (previous ?? '').trim()) return;

    setSavingHindi(`cat-${categoryId}`);
    const res = await appFetch(`/api/v1/categories/${categoryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameHi: trimmed || null }),
    }, { loading: false });
    setSavingHindi(null);

    if (res.ok) {
      setHindiDrafts((d) => {
        const next = { ...d };
        delete next[`cat-${categoryId}`];
        return next;
      });
      toast.success('Hindi category name saved');
      onRefresh();
    } else if (res.status !== 402) toast.error('Could not save Hindi category name');
  };

  const saveItemHindi = async (itemId: string, nameHi: string, previous: string) => {
    if (!hindiEnabled) {
      redirectToBilling('hindiMenu');
      return;
    }
    const trimmed = nameHi.trim();
    if (trimmed === (previous ?? '').trim()) return;

    setSavingHindi(`item-${itemId}`);
    const res = await appFetch(`/api/v1/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameHi: trimmed || null }),
    }, { loading: false });
    setSavingHindi(null);

    if (res.ok) {
      setHindiDrafts((d) => {
        const next = { ...d };
        delete next[`item-${itemId}`];
        return next;
      });
      toast.success('Hindi item name saved');
      onRefresh();
    } else if (res.status !== 402) toast.error('Could not save Hindi item name');
  };

  const scheduleCategoryHindiSave = (categoryId: string, value: string, previous: string) => {
    const key = `cat-${categoryId}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => {
      saveCategoryHindi(categoryId, value, previous);
    }, 700);
  };

  const scheduleItemHindiSave = (itemId: string, value: string, previous: string) => {
    const key = `item-${itemId}`;
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => {
      saveItemHindi(itemId, value, previous);
    }, 700);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Enter a category name');
      return;
    }
    if (guardNumericLimit('categories', categories.length)) return;
    if (newCategoryNameHi.trim() && !hindiEnabled) {
      redirectToBilling('hindiMenu');
      return;
    }

    setAddingCategory(true);
    const res = await appFetch(`/api/v1/menus/${menuId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newCategoryName.trim(),
        ...(hindiEnabled && newCategoryNameHi.trim()
          ? { nameHi: newCategoryNameHi.trim() }
          : {}),
      }),
    });
    setAddingCategory(false);
    if (!res.ok) {
      if (res.status !== 402) toast.error('Could not add category');
      return;
    }
    setNewCategoryName('');
    setNewCategoryNameHi('');
    toast.success('Category added');
    onRefresh();
  };

  const addItem = async (categoryId: string) => {
    const draft = getDraft(categoryId);
    if (!draft.name.trim() || !draft.price) {
      toast.error('Item name and price are required');
      return;
    }
    if (guardNumericLimit('itemsPerMenu', totalItems)) return;
    if (draft.nameHi.trim() && !hindiEnabled) {
      redirectToBilling('hindiMenu');
      return;
    }

    const price = parseFloat(draft.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error('Enter a valid price');
      return;
    }

    const res = await appFetch(`/api/v1/categories/${categoryId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name.trim(),
        price,
        isVeg: draft.isVeg === 'veg' ? true : draft.isVeg === 'nonveg' ? false : null,
        ...(hindiEnabled && draft.nameHi.trim() ? { nameHi: draft.nameHi.trim() } : {}),
      }),
    });

    if (!res.ok) {
      if (res.status !== 402) toast.error('Could not add item');
      return;
    }
    setDraft(categoryId, { name: '', nameHi: '', price: '', isVeg: 'veg' });
    toast.success('Item added');
    onRefresh();
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    const res = await appFetch(`/api/v1/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Item deleted');
      onRefresh();
    } else {
      toast.error('Delete failed');
    }
  };

  const toggleAvailability = async (itemId: string, isAvailable: boolean) => {
    const res = await appFetch(`/api/v1/items/${itemId}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable }),
    }, { loading: false });
    if (res.ok) onRefresh();
    else toast.error('Update failed');
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-text-muted">
        Whether you started from a template or blank, you can add items to any category.{' '}
        <span className="font-medium text-text-primary">
          {totalItems}/{limits.itemsPerMenu === Infinity ? '∞' : limits.itemsPerMenu} items
        </span>
        {plan === 'free' && (
          <span className="ml-2 text-brand">
            · Free plan: default images only — upgrade for photos & Hindi menu
          </span>
        )}
        {hindiEnabled && (
          <span className="ml-2 text-success">· Hindi names appear on guest menu preview</span>
        )}
      </p>

      <div className="rounded-lg border border-dashed border-border bg-surface-alt p-4 space-y-3">
        <Label className="text-sm font-medium">New category</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="e.g. Starters, Main Course, Drinks"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          {hindiEnabled && (
            <Input
              placeholder="Hindi name (optional)"
              value={newCategoryNameHi}
              onChange={(e) => setNewCategoryNameHi(e.target.value)}
            />
          )}
          <Button onClick={addCategory} disabled={addingCategory} className="shrink-0">
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </div>
        {!hindiEnabled && (
          <p className="text-xs text-text-muted">
            Upgrade to Starter or above to add Hindi names and the language switcher on your menu.
          </p>
        )}
      </div>

      {categories.length === 0 && (
        <p className="text-center text-text-muted py-8">
          Add your first category, then add items inside it.
        </p>
      )}

      {categories.map((cat) => (
        <section key={cat.id} className="rounded-xl border border-border bg-surface p-4">
          <div className="space-y-2">
            <h2 className="font-display text-lg font-semibold">{cat.name}</h2>
            {hindiEnabled ? (
              <div className="max-w-md space-y-1">
                <Input
                  placeholder="Hindi category name (e.g. स्टार्टर)"
                  value={getHindiDraft(`cat-${cat.id}`, cat.nameHi ?? '')}
                  onChange={(e) => {
                    const next = e.target.value;
                    setHindiDraft(`cat-${cat.id}`, next);
                    scheduleCategoryHindiSave(cat.id, next, cat.nameHi ?? '');
                  }}
                  onBlur={(e) => {
                    if (saveTimers.current[`cat-${cat.id}`]) {
                      clearTimeout(saveTimers.current[`cat-${cat.id}`]);
                    }
                    saveCategoryHindi(cat.id, e.target.value, cat.nameHi ?? '');
                  }}
                  className="text-sm font-hindi"
                  lang="hi"
                  disabled={savingHindi === `cat-${cat.id}`}
                />
                <p className="text-xs text-text-muted">Auto-saves after you type</p>
              </div>
            ) : (
              cat.nameHi && (
                <p className="text-sm text-text-muted">{cat.nameHi}</p>
              )
            )}
          </div>

          <div className="mt-4 space-y-3">
            {cat.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <ItemImageUpload
                  itemId={item.id}
                  imageUrl={item.imageUrl}
                  alt={item.name}
                  onUploaded={onRefresh}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-medium">{item.name}</p>
                  {hindiEnabled ? (
                    <Input
                      placeholder="Hindi item name (e.g. पनीर टिक्का)"
                      value={getHindiDraft(`item-${item.id}`, item.nameHi ?? '')}
                      onChange={(e) => {
                        const next = e.target.value;
                        setHindiDraft(`item-${item.id}`, next);
                        scheduleItemHindiSave(item.id, next, item.nameHi ?? '');
                      }}
                      onBlur={(e) => {
                        if (saveTimers.current[`item-${item.id}`]) {
                          clearTimeout(saveTimers.current[`item-${item.id}`]);
                        }
                        saveItemHindi(item.id, e.target.value, item.nameHi ?? '');
                      }}
                      className="text-sm font-hindi"
                      lang="hi"
                      disabled={savingHindi === `item-${item.id}`}
                    />
                  ) : (
                    item.nameHi && (
                      <p className="text-sm text-text-muted">{item.nameHi}</p>
                    )
                  )}
                  <p className="text-sm text-text-muted">{formatINR(item.price)}</p>
                  {!allowImages && (
                    <p className="text-xs text-text-muted">Tap image to upgrade for uploads</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Switch
                    checked={item.isAvailable}
                    onCheckedChange={(v) => toggleAvailability(item.id, v)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-error"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-surface-alt p-3 space-y-3">
            <p className="text-sm font-medium">Add item</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Item name (English)"
                value={getDraft(cat.id).name}
                onChange={(e) => setDraft(cat.id, { name: e.target.value })}
              />
              {hindiEnabled && (
                <Input
                  placeholder="Hindi name (optional)"
                  value={getDraft(cat.id).nameHi}
                  onChange={(e) => setDraft(cat.id, { nameHi: e.target.value })}
                  className="font-hindi"
                  lang="hi"
                />
              )}
              <Input
                type="number"
                placeholder="Price (₹)"
                value={getDraft(cat.id).price}
                onChange={(e) => setDraft(cat.id, { price: e.target.value })}
                className={hindiEnabled ? 'sm:col-span-2' : undefined}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['veg', 'nonveg', 'na'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDraft(cat.id, { isVeg: v })}
                  className={`rounded-full border px-3 py-1 text-xs capitalize ${
                    getDraft(cat.id).isVeg === v
                      ? 'border-brand bg-brand-light text-brand-dark'
                      : 'border-border'
                  }`}
                >
                  {v === 'na' ? 'N/A' : v}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => addItem(cat.id)}>
              <Plus className="h-4 w-4" />
              Add item
            </Button>
          </div>
        </section>
      ))}
    </div>
  );
}
