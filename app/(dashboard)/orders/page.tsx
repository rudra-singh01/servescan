'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatINR } from '@/lib/utils/format';
import { formatDate } from '@/lib/utils/format';

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
  const [orders, setOrders] = useState<Order[]>([]);

  const load = () => {
    fetch('/api/v1/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.data ?? []));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/v1/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-text-muted">Real-time order stream (Pro+)</p>

      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <p className="text-text-muted">Abhi koi order nahi</p>
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
