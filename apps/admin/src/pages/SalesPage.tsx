import { useEffect, useState } from 'react';
import { apiMessage, docId, http, urls, type Order } from '@/api';
import { Flash, PageLoader } from '@/components/ui';
import { useMoney } from '@/hooks';

export function SalesPage() {
  const money = useMoney();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    void http
      .get<Order[]>(urls.ordersAdmin)
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(apiMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const paidish = orders.filter((order) => order.status !== 'cancelled');
  const revenue = paidish.reduce((sum, order) => sum + order.total, 0);

  if (loading) {
    return <PageLoader label="Loading sales…" />;
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Sales</h1>
      <Flash>{error}</Flash>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="All orders" value={String(orders.length)} />
        <Stat label="Active orders" value={String(paidish.length)} />
        <Stat label="Gross revenue" value={money(revenue)} />
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-500" colSpan={4}>
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={docId(order)} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-mono text-xs">{docId(order)}</td>
                  <td className="px-4 py-3 capitalize">{order.status}</td>
                  <td className="px-4 py-3">
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {money(order.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-zinc-500">
        Payment is not wired. These totals are order records only.
      </p>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
