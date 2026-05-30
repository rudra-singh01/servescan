import { authRegisterSchema, tenantCreateSchema, publicOrderSchema } from '@/lib/validations/schemas';

describe('authRegisterSchema', () => {
  it('accepts valid name and email', () => {
    const result = authRegisterSchema.safeParse({
      name: 'Sharma Ji',
      email: 'test@example.com',
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short name', () => {
    const result = authRegisterSchema.safeParse({
      name: 'A',
      email: 'test@example.com',
      userId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});

describe('tenantCreateSchema', () => {
  it('accepts valid tenant', () => {
    const result = tenantCreateSchema.safeParse({
      name: 'Test Restaurant',
      phone: '9876543210',
      city: 'Mumbai',
    });
    expect(result.success).toBe(true);
  });
});

describe('publicOrderSchema', () => {
  it('requires at least one item', () => {
    const result = publicOrderSchema.safeParse({ items: [] });
    expect(result.success).toBe(false);
  });
});
