import Image from 'next/image';
import { DEFAULT_ITEM_IMAGE } from '@/lib/constants/menu';
import { cn } from '@/lib/utils/cn';

type Props = {
  imageUrl?: string | null;
  alt: string;
  className?: string;
  size?: 'sm' | 'md';
};

const sizes = { sm: 56, md: 80 };

/** Item thumbnail — uses default image when none uploaded. */
export function ItemImage({ imageUrl, alt, className, size = 'sm' }: Props) {
  const px = sizes[size];
  const src = imageUrl?.trim() ? imageUrl : DEFAULT_ITEM_IMAGE;

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-lg bg-surface-alt',
        className,
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src={src}
        alt={alt}
        width={px}
        height={px}
        className="h-full w-full object-cover"
        unoptimized={src.startsWith('/')}
      />
    </div>
  );
}
