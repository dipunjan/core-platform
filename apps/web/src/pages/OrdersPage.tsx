import { docId } from '@/api';
import { EmptyState, Flash, OrderCard, PageTitle, TextLink } from '@/components';
import { useOrders } from '@/hooks';

export function OrdersPage() {
  const { orders, error, loading, cancel } = useOrders({ load: true });

  return (
    <>
      <PageTitle className="mb-6">Orders</PageTitle>
      <Flash>{error}</Flash>
      {error ? null : orders.length === 0 ? (
        <EmptyState>
          None yet. <TextLink to="/cart">Go to cart</TextLink>
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
