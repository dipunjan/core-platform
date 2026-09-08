import { useEffect, useState } from 'react';
import { apiMessage, docId, http, urls, type Order } from '@/api';
import { Flash, PageHeader, PageLoader } from '@/components/ui';
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
      <PageHeader
        title="Sales"
        description="Order volume and revenue across the storefront. Payment is not wired — these are order records only."
      />
      <Flash>{error}</Flash>
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <Stat label="All orders" value={String(orders.length)} tone="orders" />
        </div>
        <div className="col-md-4">
          <Stat label="Active orders" value={String(paidish.length)} tone="active" />
        </div>
        <div className="col-md-4">
          <Stat label="Gross revenue" value={money(revenue)} tone="revenue" />
        </div>
      </div>
      <div className="card admin-table-card">
        <table className="table table-hover align-middle mb-0">
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
                  <td>
                    <span className="badge text-bg-light text-capitalize border">
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </td>
                  <td className="text-end font-monospace fw-semibold">
                    {money(order.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'orders' | 'active' | 'revenue';
}) {
  return (
    <div className={`card stat-card stat-card--${tone}`}>
      <div className="card-body">
        <p className="stat-card-label mb-0">{label}</p>
        <p className="stat-card-value mb-0">{value}</p>
      </div>
    </div>
  );
}
