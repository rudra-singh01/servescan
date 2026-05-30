import { withAuth } from '@/lib/api/handler';
import { success } from '@/lib/api/response';
import { availabilitySchema } from '@/lib/validations/schemas';
import * as itemService from '@/lib/services/item.service';
import { ValidationError } from '@/lib/api/errors';

export const PATCH = withAuth(async (req, { tenant }, params) => {
  const body = await req.json();
  const parsed = availabilitySchema.safeParse(body);
  if (!parsed.success) throw new ValidationError('Invalid input', parsed.error.flatten());

  const item = await itemService.toggleAvailability(
    params!.id,
    tenant.id,
    parsed.data.isAvailable,
  );
  return success(item);
});
