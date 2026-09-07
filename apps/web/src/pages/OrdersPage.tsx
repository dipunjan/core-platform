import { docId } from '@/api';
import { EmptyState, Flash, OrderCard, PageLoader, PageTitle, TextLink } from '@/components';
import { useOrders } from '@/hooks';

export function OrdersPage() {
  const { orders, error, loading, cancel } = useOrders({ load: true });

  if (loading && orders.length === 0) {
    return (
      <>
        <PageTitle className="mb-6">Orders</PageTitle>
        <PageLoader label="Loading your orders…" />
      </>
    );
  }

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
