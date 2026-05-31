'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatINR, formatDate } from '@/lib/utils/format';
import { useLoading } from '@/components/providers/loading-provider';
import { usePlan, usePlanGate } from '@/components/providers/plan-provider';

type Order = {
  id: string;
  orderNumber: string;
  tableNumber?: string;
  status: string;
  total: string;
  createdAt: string;
};

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed'] as const;

export default function OrdersPage() {
  usePlanGate('tableOrdering');
  const { withLoading } = useLoading();
  const { planLoading, appFetch } = usePlan();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageReady, setPageReady] = useState(false);

  const load = useCallback(
    async (showLoader = false) => {
      const fetchOrders = async () => {
        const res = await appFetch('/api/v1/orders', undefined, { loading: false });
        const body = await res.json();
        if (res.ok) setOrders(body.data ?? []);
      };

      if (showLoader) {
        await withLoading(fetchOrders, 'Loading orders…');
      } else {
        await fetchOrders();
      }
    },
    [appFetch, withLoading],
  );

  useEffect(() => {
    if (planLoading) return;
    load(true).then(() => setPageReady(true));
    const interval = setInterval(() => load(false), 30000);
    return () => clearInterval(interval);
  }, [planLoading, load]);

  const updateStatus = async (id: string, status: string) => {
    await appFetch(`/api/v1/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }, { loading: false });
    load(false);
  };

  if (planLoading || !pageReady) return null;

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-text-muted">Real-time order stream (Pro+)</p>

      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <p className="text-text-muted">No orders yet</p>
        ) : (
          orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-mono text-lg">{order.orderNumber}</CardTitle>
                <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs capitalize text-brand">
                  {order.status}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-muted">
                  {order.tableNumber && `Table ${order.tableNumber} · `}
                  {formatDate(order.createdAt)}
                </p>
                <p className="mt-1 text-lg font-semibold">{formatINR(order.total)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={order.status === s ? 'default' : 'outline'}
                      onClick={() => updateStatus(order.id, s)}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
