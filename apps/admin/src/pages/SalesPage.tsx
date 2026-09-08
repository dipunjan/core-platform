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
      <h1 className="h2 mb-4">Sales</h1>
      <Flash>{error}</Flash>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <Stat label="All orders" value={String(orders.length)} />
        </div>
        <div className="col-md-4">
          <Stat label="Active orders" value={String(paidish.length)} />
        </div>
        <div className="col-md-4">
          <Stat label="Gross revenue" value={money(revenue)} />
        </div>
      </div>
      <div className="table-responsive card">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Items</th>
              <th className="text-end">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td className="text-center text-muted py-5" colSpan={4}>
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={docId(order)}>
                  <td className="font-monospace small">{docId(order)}</td>
                  <td className="text-capitalize">{order.status}</td>
                  <td>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="text-end font-monospace">
                    {money(order.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-muted small">
        Payment is not wired. These totals are order records only.
      </p>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card h-100">
      <div className="card-body">
        <p className="small fw-semibold text-uppercase text-muted mb-1">
          {label}
        </p>
        <p className="h3 mb-0 font-monospace">{value}</p>
      </div>
    </div>
  );
}
