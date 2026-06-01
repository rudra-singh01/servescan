import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  jsonb,
  numeric,
  integer,
  bigint,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('users_username_idx').on(t.username), index('users_email_idx').on(t.email)],
);

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().unique(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    phone: text('phone'),
    email: text('email'),
    plan: text('plan').notNull().default('free'),
    planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    logoUrl: text('logo_url'),
    address: jsonb('address').$type<{
      line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
    }>(),
    gstNumber: text('gst_number'),
    settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('tenants_slug_idx').on(t.slug), index('tenants_owner_idx').on(t.ownerId)],
);

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    address: jsonb('address').$type<Record<string, string>>(),
    phone: text('phone'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('branches_tenant_slug_idx').on(t.tenantId, t.slug),
    index('branches_tenant_idx').on(t.tenantId),
  ],
);

export const teamMembers = pgTable(
  'team_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    role: text('role').notNull(),
    branchId: uuid('branch_id').references(() => branches.id),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('team_members_tenant_user_idx').on(t.tenantId, t.userId),
    index('team_members_user_idx').on(t.userId),
  ],
);

export const menus = pgTable(
  'menus',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(false).notNull(),
    isPublic: boolean('is_public').default(true).notNull(),
    theme: jsonb('theme').$type<Record<string, unknown>>().default({}),
    language: text('language').default('en').notNull(),
    scanCount: bigint('scan_count', { mode: 'number' }).default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('menus_branch_slug_idx').on(t.branchId, t.slug),
    index('menus_tenant_idx').on(t.tenantId),
    index('menus_slug_idx').on(t.slug),
    index('menus_active_idx').on(t.isActive),
  ],
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameHi: text('name_hi'),
    description: text('description'),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('categories_menu_idx').on(t.menuId),
    index('categories_tenant_idx').on(t.tenantId),
  ],
);

export type CustomisationGroup = {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  max?: number;
  options: { id: string; name: string; price_delta: number }[];
};

export const items = pgTable(
  'items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameHi: text('name_hi'),
    description: text('description'),
    descriptionHi: text('description_hi'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    comparePrice: numeric('compare_price', { precision: 10, scale: 2 }),
    imageUrl: text('image_url'),
    isVeg: boolean('is_veg'),
    isAvailable: boolean('is_available').default(true).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isSpicy: boolean('is_spicy').default(false).notNull(),
    tags: text('tags').array().default([]),
    allergens: text('allergens').array().default([]),
    sortOrder: integer('sort_order').default(0).notNull(),
    calories: integer('calories'),
    customisations: jsonb('customisations').$type<CustomisationGroup[]>().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('items_category_idx').on(t.categoryId),
    index('items_menu_idx').on(t.menuId),
    index('items_tenant_idx').on(t.tenantId),
    index('items_available_idx').on(t.isAvailable),
  ],
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id),
    menuId: uuid('menu_id').references(() => menus.id),
    orderNumber: text('order_number').notNull(),
    tableNumber: text('table_number'),
    customerName: text('customer_name'),
    customerPhone: text('customer_phone'),
    status: text('status').notNull().default('pending'),
    items: jsonb('items').$type<unknown[]>().notNull(),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0'),
    discount: numeric('discount', { precision: 10, scale: 2 }).default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    paymentStatus: text('payment_status').default('unpaid'),
    paymentMethod: text('payment_method'),
    razorpayOrderId: text('razorpay_order_id'),
    notes: text('notes'),
    idempotencyKey: text('idempotency_key').unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('orders_tenant_idx').on(t.tenantId),
    index('orders_status_idx').on(t.status),
    index('orders_created_idx').on(t.createdAt),
  ],
);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id').references(() => items.id),
  itemName: text('item_name').notNull(),
  itemPrice: numeric('item_price', { precision: 10, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull(),
  customisations: jsonb('customisations').$type<Record<string, unknown>>().default({}),
  notes: text('notes'),
});

export const scans = pgTable(
  'scans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id),
    tableNumber: text('table_number'),
    userAgent: text('user_agent'),
    ipHash: text('ip_hash'),
    country: text('country'),
    city: text('city'),
    sessionId: text('session_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('scans_menu_idx').on(t.menuId),
    index('scans_tenant_idx').on(t.tenantId),
    index('scans_created_idx').on(t.createdAt),
  ],
);

/** Cashfree (or other PG) checkout attempts for plan upgrades. */
export const planPayments = pgTable(
  'plan_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    plan: text('plan').notNull(),
    orderId: text('order_id').notNull().unique(),
    cashfreeOrderId: text('cashfree_order_id'),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    currency: text('currency').default('INR').notNull(),
    status: text('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('plan_payments_tenant_idx').on(t.tenantId),
    index('plan_payments_order_idx').on(t.orderId),
  ],
);

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    plan: text('plan').notNull(),
    status: text('status').notNull(),
    razorpaySubId: text('razorpay_sub_id').unique(),
    razorpayPlanId: text('razorpay_plan_id'),
    cashfreeOrderId: text('cashfree_order_id'),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('subscriptions_tenant_idx').on(t.tenantId)],
);

export const qrCodes = pgTable(
  'qr_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id').references(() => branches.id),
    tableNumber: text('table_number'),
    url: text('url').notNull(),
    imageUrl: text('image_url'),
    printUrl: text('print_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('qr_codes_menu_idx').on(t.menuId)],
);

export const slugRedirects = pgTable(
  'slug_redirects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    oldSlug: text('old_slug').notNull(),
    newSlug: text('new_slug').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('slug_redirects_old_idx').on(t.oldSlug)],
);

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  branches: many(branches),
  menus: many(menus),
  teamMembers: many(teamMembers),
}));

export const branchesRelations = relations(branches, ({ one, many }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
  menus: many(menus),
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
  tenant: one(tenants, { fields: [menus.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [menus.branchId], references: [branches.id] }),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  menu: one(menus, { fields: [categories.menuId], references: [menus.id] }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  category: one(categories, { fields: [items.categoryId], references: [categories.id] }),
  menu: one(menus, { fields: [items.menuId], references: [menus.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Branch = typeof branches.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type QrCode = typeof qrCodes.$inferSelect;
export type PlanPayment = typeof planPayments.$inferSelect;
