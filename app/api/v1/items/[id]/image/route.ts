import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';
import type { Plan } from '@/lib/constants';
import { assertItemImageUpload } from '@/lib/plan/item-images';
import { isImageKitConfigured } from '@/lib/imagekit/config';
import { uploadMenuItemImage, validateImageFile } from '@/lib/imagekit/upload';
import * as itemService from '@/lib/services/item.service';

export const runtime = 'nodejs';

export const POST = withAuth(async (req, { tenant }, params) => {
  assertItemImageUpload(tenant.plan as Plan);

  if (!isImageKitConfigured()) {
    throw new ValidationError('Image uploads are not configured on the server');
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new ValidationError('No image file provided');
  }

  validateImageFile(file);

  const buffer = Buffer.from(await file.arrayBuffer());
  let imageUrl: string;
  try {
    imageUrl = await uploadMenuItemImage(buffer, file.name, tenant.id, params!.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Image upload failed';
    throw new ValidationError(message);
  }

  const item = await itemService.updateItem(params!.id, tenant.id, { imageUrl });
  return success({ imageUrl: item.imageUrl, item });
});

export const DELETE = withAuth(async (_req, { tenant }, params) => {
  assertItemImageUpload(tenant.plan as Plan);

  const item = await itemService.updateItem(params!.id, tenant.id, { imageUrl: null });
  return success({ imageUrl: item.imageUrl, item });
});
