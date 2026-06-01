import { PlanLimitError } from '@/lib/api/errors';
import type { Plan } from '@/lib/constants';
import { canUploadItemImages } from '@/lib/constants/menu';

/** Paid plans only — free users get HTTP 402 with billing redirect. */
export function assertItemImageUpload(plan: Plan) {
  if (!canUploadItemImages(plan)) {
    throw new PlanLimitError('itemImages', 0);
  }
}
