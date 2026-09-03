import { Link } from 'react-router-dom';
import { docId } from '@/api';
import { EmptyState, Flash, OrderCard } from '@/components';
import { useOrders } from '@/hooks';

export function OrdersPage() {
  const { orders, error, loading, cancel } = useOrders({ load: true });

  return (
    <>
      <h1>Orders</h1>
      <Flash>{error}</Flash>
      {error ? null : orders.length === 0 ? (
        <EmptyState>
          None yet. <Link to="/cart">Go to cart</Link>
        </EmptyState>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={docId(order)}
            order={order}
            busy={loading}
            onCancel={(id) => void cancel(id)}
          />
        ))
      )}
    </>
  );
}
