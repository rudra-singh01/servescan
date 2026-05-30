'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ItemImage } from '@/components/menu/item-image';
import { formatINR } from '@/lib/utils/format';
import { canUploadItemImages } from '@/lib/constants/menu';
import { PLAN_LIMITS } from '@/lib/razorpay/plans';
import type { Plan } from '@/lib/constants';
import { toast } from 'sonner';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import Link from 'next/link';

export type EditorItem = {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  isVeg: boolean | null;
};

export type EditorCategory = {
  id: string;
  name: string;
  items: EditorItem[];
};

type Props = {
  menuId: string;
  categories: EditorCategory[];
  plan: Plan;
  onRefresh: () => void;
};

export function MenuEditor({ menuId, categories, plan, onRefresh }: Props) {
  const limits = PLAN_LIMITS[plan];
  const totalItems = categories.reduce((n, c) => n + c.items.length, 0);
  const allowImages = canUploadItemImages(plan);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [itemDrafts, setItemDrafts] = useState<
    Record<string, { name: string; price: string; isVeg: string }>
  >({});

  const getDraft = (categoryId: string) =>
    itemDrafts[categoryId] ?? { name: '', price: '', isVeg: 'veg' };

  const setDraft = (categoryId: string, patch: Partial<{ name: string; price: string; isVeg: string }>) => {
    setItemDrafts((d) => ({
      ...d,
      [categoryId]: { ...getDraft(categoryId), ...patch },
    }));
  };

  const handlePlanError = async (res: Response) => {
    const err = await res.json();
    if (err.error?.code === 'plan_limit_exceeded') {
      toast.error(`Plan limit reached (max ${err.error.max}). Upgrade your plan.`, {
        action: { label: 'Billing', onClick: () => (window.location.href = '/settings/billing') },
      });
      return true;
    }
    return false;
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Enter a category name');
      return;
    }
    if (categories.length >= limits.categories) {
      toast.error(`Your plan allows up to ${limits.categories} categories`);
      return;
    }
    setAddingCategory(true);
    const res = await fetch(`/api/v1/menus/${menuId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.trim() }),
    });
    setAddingCategory(false);
    if (!res.ok) {
      if (!(await handlePlanError(res))) toast.error('Could not add category');
      return;
    }
    setNewCategoryName('');
    toast.success('Category added');
    onRefresh();
  };

  const addItem = async (categoryId: string) => {
    const draft = getDraft(categoryId);
    if (!draft.name.trim() || !draft.price) {
      toast.error('Item name and price are required');
      return;
    }
    if (totalItems >= limits.itemsPerMenu) {
      toast.error(`Your plan allows up to ${limits.itemsPerMenu} items per menu`);
      return;
    }
    const price = parseFloat(draft.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error('Enter a valid price');
      return;
    }

    const res = await fetch(`/api/v1/categories/${categoryId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name.trim(),
        price,
        isVeg: draft.isVeg === 'veg' ? true : draft.isVeg === 'nonveg' ? false : null,
      }),
    });

    if (!res.ok) {
      if (!(await handlePlanError(res))) toast.error('Could not add item');
      return;
    }
    setDraft(categoryId, { name: '', price: '', isVeg: 'veg' });
    toast.success('Item added');
    onRefresh();
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    const res = await fetch(`/api/v1/items/${itemId}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Item deleted');
      onRefresh();
    } else {
      toast.error('Delete fail');
    }
  };

  const toggleAvailability = async (itemId: string, isAvailable: boolean) => {
    const res = await fetch(`/api/v1/items/${itemId}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isAvailable }),
    });
    if (res.ok) onRefresh();
    else toast.error('Update fail');
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-text-muted">
        Whether you started from a template or blank, you can add items to any category.{' '}
        <span className="font-medium text-text-primary">
          {totalItems}/{limits.itemsPerMenu === Infinity ? '∞' : limits.itemsPerMenu} items
        </span>
        {!allowImages && (
          <span className="ml-2 text-brand">· Free plan: default image (upload Pro+)</span>
        )}
      </p>

      {/* Add category */}
      <div className="rounded-lg border border-dashed border-border bg-surface-alt p-4">
        <Label className="text-sm font-medium">New category</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <Input
            placeholder="e.g. Starters, Main Course, Drinks"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <Button onClick={addCategory} disabled={addingCategory} className="shrink-0">
            <Plus className="h-4 w-4" />
            Add category
          </Button>
        </div>
      </div>

      {categories.length === 0 && (
        <p className="text-center text-text-muted py-8">
          Add your first category, then add items inside it.
        </p>
      )}

      {categories.map((cat) => (
        <section key={cat.id} className="rounded-xl border border-border bg-surface p-4">
          <h2 className="font-display text-lg font-semibold">{cat.name}</h2>

          <div className="mt-4 space-y-3">
            {cat.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <ItemImage imageUrl={item.imageUrl} alt={item.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-text-muted">{formatINR(item.price)}</p>
                  {allowImages && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                      <ImageIcon className="h-3 w-3" />
                      Image upload (coming soon)
                    </p>
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

          {/* Add item form */}
          <div className="mt-4 rounded-lg bg-surface-alt p-3 space-y-3">
            <p className="text-sm font-medium">Add item</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Item name"
                value={getDraft(cat.id).name}
                onChange={(e) => setDraft(cat.id, { name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Price (₹)"
                value={getDraft(cat.id).price}
                onChange={(e) => setDraft(cat.id, { price: e.target.value })}
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
