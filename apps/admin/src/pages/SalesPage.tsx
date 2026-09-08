import { queryError, docId } from '@/api';
import { Button, Flash, PageHeader, PageLoader } from '@/components/ui';
import { useMoney } from '@/hooks';
import { useAdminOrderStatusMutation, useAdminOrdersQuery } from '@/query';

export function SalesPage() {
  const money = useMoney();
  const { data: orders = [], isLoading, error } = useAdminOrdersQuery();
  const updateStatus = useAdminOrderStatusMutation();

  const paidish = orders.filter((order) => order.status !== 'cancelled');
  const revenue = paidish.reduce((sum, order) => sum + order.total, 0);

  if (isLoading) {
    return <PageLoader label="Loading sales…" />;
  }

  return (
    <>
      <PageHeader title="Sales" />
      <Flash>{queryError(error ?? updateStatus.error, 'Could not load sales')}</Flash>
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
              <th>Payment</th>
              <th>Items</th>
              <th className="text-end">Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td className="text-center text-muted py-5" colSpan={6}>
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const id = docId(order);
                const busy = updateStatus.isPending && updateStatus.variables?.id === id;
                return (
                  <tr key={id}>
                    <td className="font-monospace small">{id}</td>
                    <td>
                      <span className="badge text-bg-light text-capitalize border">
                        {order.status}
                      </span>
                    </td>
                    <td className="small text-capitalize text-muted">
                      {order.paymentStatus ?? 'unpaid'}
                      {order.paymentProvider ? ` · ${order.paymentProvider}` : ''}
                    </td>
                    <td>
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                    </td>
                    <td className="text-end font-monospace fw-semibold">
                      {money(order.total)}
                    </td>
                    <td className="text-end">
                      {order.status === 'paid' ? (
                        <Button
                          type="button"
                          variant="secondary"
                          loading={busy}
                          onClick={() =>
                            void updateStatus.mutateAsync({ id, status: 'shipped' })
                          }
                        >
                          Mark shipped
                        </Button>
                      ) : null}
                      {order.status === 'pending' ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="ms-2"
                          loading={busy}
                          onClick={() =>
                            void updateStatus.mutateAsync({ id, status: 'cancelled' })
                          }
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
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
