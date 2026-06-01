import ImageKit, { toFile } from '@imagekit/nodejs';
import { getImageKitConfig } from '@/lib/imagekit/config';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

let client: ImageKit | null = null;

function getClient() {
  if (!client) {
    const { privateKey } = getImageKitConfig();
    client = new ImageKit({ privateKey });
  }
  return client;
}

export function validateImageFile(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, or GIF images are allowed');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 5 MB or smaller');
  }
}

/** Upload menu item image to ImageKit; returns public CDN URL. */
export async function uploadMenuItemImage(
  buffer: Buffer,
  fileName: string,
  tenantId: string,
  itemId: string,
): Promise<string> {
  const ik = getClient();
  const safeName = fileName.replace(/[^\w.-]+/g, '_').slice(0, 80) || 'photo.jpg';

  const result = await ik.files.upload({
    file: await toFile(buffer, safeName),
    fileName: safeName,
    folder: `/scanserve/${tenantId}/items`,
    tags: [`tenant:${tenantId}`, `item:${itemId}`],
  });

  const url = result.url;
  if (!url) {
    throw new Error('ImageKit upload did not return a URL');
  }
  return url;
}
