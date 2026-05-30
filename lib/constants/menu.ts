/** Default placeholder when item has no image (free plan / no upload). */
export const DEFAULT_ITEM_IMAGE = '/images/menu-item-default.svg';

/** Free plan cannot upload item images — show placeholder only. */
export function canUploadItemImages(plan: string): boolean {
  return plan !== 'free';
}
