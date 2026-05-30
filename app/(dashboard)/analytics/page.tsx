'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatINR } from '@/lib/utils/format';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState({ scans: 0, orders: 0, revenue: 0 });
  const [series, setSeries] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    fetch('/api/v1/analytics/overview?days=7')
      .then((r) => r.json())
      .then((d) => setOverview(d.data ?? {}));
    fetch('/api/v1/analytics/scans?days=7')
      .then((r) => r.json())
      .then((d) => setSeries(d.data ?? []));
  }, []);

  return (
    <div className="p-4 md:p-8">
      <h1 className="font-display text-2xl font-bold">Analytics</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted">Scans (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.scans}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{overview.orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-text-muted">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatINR(overview.revenue)}</p>
          </CardContent>
        </Card>
      </div>

      {series.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Scan trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ea580c" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
