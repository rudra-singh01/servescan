import { db } from '@/lib/db';
import { tenants, branches, teamMembers } from '@/lib/db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { slugify, slugWithSuffix } from '@/lib/utils/slugify';
import type { TenantCreateInput } from '@/lib/validations/schemas';
import { ConflictError, NotFoundError } from '@/lib/api/errors';

/** Resolve unique tenant slug with silent suffix increment. */
export async function resolveUniqueSlug(baseName: string, excludeId?: string): Promise<string> {
  const base = slugify(baseName);
  let suffix = 1;
  while (suffix < 100) {
    const candidate = slugWithSuffix(base, suffix);
    const existing = await db!
      .select({ id: tenants.id })
      .from(tenants)
      .where(
        excludeId
          ? and(eq(tenants.slug, candidate), ne(tenants.id, excludeId))
          : eq(tenants.slug, candidate),
      )
      .limit(1);
    if (existing.length === 0) return candidate;
    suffix++;
  }
  return `${base}-${Date.now()}`;
}

/** Create tenant with default branch and owner team member. */
export async function createTenant(ownerId: string, input: TenantCreateInput) {
  const slug = await resolveUniqueSlug(input.name);

  return db!.transaction(async (tx) => {
    const [tenant] = await tx
      .insert(tenants)
      .values({
        ownerId,
        name: input.name,
        slug,
        phone: input.phone,
        logoUrl: input.logoUrl,
        address: { city: input.city },
        settings: { cuisineTypes: input.cuisineTypes ?? [] },
      })
      .returning();

    const [branch] = await tx
      .insert(branches)
      .values({
        tenantId: tenant.id,
        name: 'Main Branch',
        slug: 'main',
      })
      .returning();

    await tx.insert(teamMembers).values({
      tenantId: tenant.id,
      userId: ownerId,
      role: 'owner',
      branchId: branch.id,
    });

    return { tenant, branch };
  });
}

/** Get tenant by slug for public menu. */
export async function getTenantBySlug(slug: string) {
  const [tenant] = await db!.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  if (!tenant || !tenant.isActive) throw new NotFoundError('Restaurant not found');
  return tenant;
}

/** Update tenant profile. */
export async function updateTenant(tenantId: string, data: Partial<TenantCreateInput>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name) updates.name = data.name;
  if (data.phone) updates.phone = data.phone;
  if (data.logoUrl) updates.logoUrl = data.logoUrl;
  if (data.city) updates.address = { city: data.city };

  const [updated] = await db!
    .update(tenants)
    .set(updates)
    .where(eq(tenants.id, tenantId))
    .returning();
  return updated;
}
