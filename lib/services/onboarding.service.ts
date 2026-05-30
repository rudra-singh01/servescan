import * as tenantService from './tenant.service';
import * as menuService from './menu.service';
import type { TenantCreateInput } from '@/lib/validations/schemas';
import type { MenuTemplate } from '@/lib/constants';
import type { Plan } from '@/lib/constants';

/** Complete onboarding step 1 — create tenant. */
export async function onboardTenant(ownerId: string, input: TenantCreateInput) {
  return tenantService.createTenant(ownerId, input);
}

/** Complete onboarding step 2 — create first menu from template. */
export async function onboardMenu(
  tenantId: string,
  branchId: string,
  plan: Plan,
  template: MenuTemplate,
  menuName?: string,
) {
  return menuService.createMenuFromTemplate(tenantId, branchId, plan, template, menuName);
}
