'use client';

import { useRef, useState } from 'react';
import { ItemImage } from '@/components/menu/item-image';
import { Button } from '@/components/ui/button';
import { usePlan } from '@/components/providers/plan-provider';
import { canUploadItemImages } from '@/lib/constants/menu';
import { toast } from 'sonner';
import { ImageIcon, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type Props = {
  itemId: string;
  imageUrl?: string | null;
  alt: string;
  onUploaded: () => void;
};

export function ItemImageUpload({ itemId, imageUrl, alt, onUploaded }: Props) {
  const { plan, appFetch, redirectToBilling } = usePlan();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const allowUpload = canUploadItemImages(plan);

  const pickFile = () => {
    if (!allowUpload) {
      redirectToBilling('itemImages');
      return;
    }
    inputRef.current?.click();
  };

  const upload = async (file: File) => {
    setUploading(true);
    const body = new FormData();
    body.append('file', file);

    const res = await appFetch(`/api/v1/items/${itemId}/image`, {
      method: 'POST',
      body,
    });
    setUploading(false);

    if (res.ok) {
      toast.success('Photo uploaded');
      onUploaded();
      return;
    }
    if (res.status === 402) return;

    try {
      const json = await res.json();
      const msg =
        json?.error?.message ??
        (typeof json?.error === 'string' ? json.error : null) ??
        'Upload failed';
      toast.error(msg);
    } catch {
      toast.error('Upload failed');
    }
  };

  const removeImage = async () => {
    if (!confirm('Remove this photo?')) return;
    setUploading(true);
    const res = await appFetch(`/api/v1/items/${itemId}/image`, { method: 'DELETE' });
    setUploading(false);
    if (res.ok) {
      toast.success('Photo removed');
      onUploaded();
    } else if (res.status !== 402) {
      toast.error('Could not remove photo');
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <button
        type="button"
        onClick={pickFile}
        disabled={uploading}
        className={cn(
          'group relative rounded-lg ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
          !allowUpload && 'cursor-pointer opacity-90',
        )}
        title={allowUpload ? 'Upload photo' : 'Upgrade to upload photos'}
      >
        <ItemImage imageUrl={imageUrl} alt={alt} size="md" />
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100',
            uploading && 'opacity-100',
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) upload(file);
        }}
      />

      {allowUpload && imageUrl?.trim() && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-text-muted"
          disabled={uploading}
          onClick={removeImage}
        >
          <X className="h-3 w-3" />
          Remove
        </Button>
      )}
    </div>
  );
}
