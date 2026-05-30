import { z } from 'zod';
import { MENU_TEMPLATES, ORDER_STATUSES, TEAM_ROLES } from '@/lib/constants';

const indianPhone = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Valid 10-digit Indian mobile number required');

/** Email + password auth (phone OTP commented out for now). */
export const authRegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  userId: z.string().uuid(),
});

// Phone OTP — enable when SMS auth is turned on
// export const sendOtpSchema = z
//   .object({
//     phone: indianPhone.optional(),
//     email: z.string().email().optional(),
//   })
//   .refine((d) => d.phone || d.email, 'Phone or email is required');
//
// export const verifyOtpSchema = z.object({
//   token: z.string().min(4),
//   phone: indianPhone.optional(),
//   email: z.string().email().optional(),
// });

export const tenantCreateSchema = z.object({
  name: z.string().min(3).max(80),
  phone: indianPhone,
  city: z.string().min(2).max(100),
  cuisineTypes: z.array(z.string()).optional(),
  logoUrl: z.string().url().optional(),
});

export const menuCreateSchema = z.object({
  name: z.string().min(1).max(100),
  branchId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  language: z.enum(['en', 'hi', 'ta', 'te', 'bn']).default('en'),
});

export const onboardingMenuSchema = z.object({
  template: z.enum(MENU_TEMPLATES),
  menuName: z.string().min(1).max(100).optional(),
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  nameHi: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
});

export const itemCreateSchema = z.object({
  name: z.string().min(1).max(120),
  nameHi: z.string().max(120).optional(),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0),
  comparePrice: z.coerce.number().min(0).optional(),
  isVeg: z.boolean().nullable().optional(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isSpicy: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  allergens: z.array(z.string()).default([]),
  imageUrl: z.string().url().optional(),
  customisations: z.array(z.record(z.unknown())).default([]),
});

export const reorderSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int().min(0),
  }),
);

export const availabilitySchema = z.object({
  isAvailable: z.boolean(),
});

export const qrGenerateSchema = z.object({
  menuId: z.string().uuid(),
  tableNumber: z.string().max(20).optional(),
  style: z.enum(['standard', 'branded']).default('standard'),
  size: z.enum(['small', 'medium', 'large']).default('medium'),
});

export const publicOrderSchema = z.object({
  tableNumber: z.string().max(20).optional(),
  customerName: z.string().max(100).optional(),
  customerPhone: indianPhone.optional(),
  items: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        quantity: z.number().int().min(1).max(99),
        customisations: z.record(z.unknown()).optional(),
        notes: z.string().max(200).optional(),
      }),
    )
    .min(1),
  notes: z.string().max(500).optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const teamInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(TEAM_ROLES),
  branchId: z.string().uuid().optional(),
});

export const branchCreateSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).optional(),
  phone: indianPhone.optional(),
  address: z
    .object({
      line1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
    })
    .optional(),
});

export type AuthRegisterInput = z.infer<typeof authRegisterSchema>;
export type TenantCreateInput = z.infer<typeof tenantCreateSchema>;
export type MenuCreateInput = z.infer<typeof menuCreateSchema>;
export type ItemCreateInput = z.infer<typeof itemCreateSchema>;
export type PublicOrderInput = z.infer<typeof publicOrderSchema>;
