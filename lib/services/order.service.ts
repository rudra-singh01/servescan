import { createHash } from 'crypto';
import { db } from '@/lib/db';
import { orders, orderItems, items, menus } from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { ConflictError, NotFoundError } from '@/lib/api/errors';
import type { PublicOrderInput } from '@/lib/validations/schemas';
import { PLAN_LIMITS } from '@/lib/razorpay/plans';
import type { Plan } from '@/lib/constants';
import { PlanLimitError } from '@/lib/api/errors';

/** Calculate order total from DB prices. */
export async function calculateOrderTotal(
  menuId: string,
  lineItems: PublicOrderInput['items'],
) {
  const dbItems = await db!
    .select()
    .from(items)
    .where(eq(items.menuId, menuId));

  const itemMap = new Map(dbItems.map((i) => [i.id, i]));
  const unavailable: string[] = [];
  let subtotal = 0;

  for (const line of lineItems) {
    const item = itemMap.get(line.itemId);
    if (!item || !item.isAvailable) {
      unavailable.push(item?.name ?? line.itemId);
      continue;
    }
    subtotal += parseFloat(item.price) * line.quantity;
  }

  if (unavailable.length > 0) {
    throw new ConflictError(`Unavailable items: ${unavailable.join(', ')}`);
  }

  const taxAmount = subtotal * 0.05;
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total, itemMap };
}

/** Place guest order with idempotency. */
export async function placeOrder(
  tenantId: string,
  menuId: string,
  branchId: string,
  plan: Plan,
  input: PublicOrderInput,
  idempotencyKey?: string,
) {
  if (!PLAN_LIMITS[plan].tableOrdering) {
    throw new PlanLimitError('tableOrdering', 0);
  }

  if (idempotencyKey) {
    const [existing] = await db!
      .select()
      .from(orders)
      .where(eq(orders.idempotencyKey, idempotencyKey))
      .limit(1);
    if (existing) return existing;
  }

  const { subtotal, taxAmount, total, itemMap } = await calculateOrderTotal(menuId, input.items);

  const count = await db!
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(eq(orders.tenantId, tenantId));
  const orderNumber = `#${String((count[0]?.count ?? 0) + 1).padStart(4, '0')}`;

  const snapshot = input.items.map((line) => {
    const item = itemMap.get(line.itemId)!;
    return {
      itemId: line.itemId,
      name: item.name,
      price: item.price,
      quantity: line.quantity,
      customisations: line.customisations,
      notes: line.notes,
    };
  });

  const [order] = await db!.transaction(async (tx) => {
    const [o] = await tx
      .insert(orders)
      .values({
        tenantId,
        branchId,
        menuId,
        orderNumber,
        tableNumber: input.tableNumber,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        items: snapshot,
        subtotal: String(subtotal),
        taxAmount: String(taxAmount),
        total: String(total),
        notes: input.notes,
        idempotencyKey,
      })
      .returning();

    for (const line of input.items) {
      const item = itemMap.get(line.itemId)!;
      await tx.insert(orderItems).values({
        orderId: o.id,
        itemId: line.itemId,
        itemName: item.name,
        itemPrice: item.price,
        quantity: line.quantity,
        customisations: line.customisations ?? {},
        notes: line.notes,
      });
    }
    return [o];
  });

  return order;
}

/** List orders for tenant. */
export async function listOrders(
  tenantId: string,
  filters?: { status?: string; from?: Date; to?: Date },
) {
  const conditions = [eq(orders.tenantId, tenantId)];
  if (filters?.status) conditions.push(eq(orders.status, filters.status));

  return db!
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(100);
}

/** Update order status. */
export async function updateOrderStatus(orderId: string, tenantId: string, status: string) {
  const [order] = await db!
    .update(orders)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
    .returning();
  if (!order) throw new NotFoundError();
  return order;
}

/** Get order status for guest polling. */
export async function getOrderStatus(orderId: string) {
  const [order] = await db!
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) throw new NotFoundError();
  return order;
}
