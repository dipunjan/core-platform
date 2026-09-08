import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { docId, type Product } from '@/api';
import { EmptyState, Flash, OrderCard, PageLoader, PageTitle, TextLink } from '@/components';
import { useCatalog, useOrders } from '@/hooks';

export function OrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orders, error, loading, cancel } = useOrders({ load: true });
  const { products } = useCatalog({ load: true });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const state = location.state as { orderPlaced?: boolean } | null;
    if (state?.orderPlaced) {
      setSuccess('Order placed. We will ship to the address you entered.');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const productsById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) {
      map.set(docId(product), product);
    }
    return map;
  }, [products]);

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
      <Flash tone="success">{success}</Flash>
      <Flash>{error}</Flash>
      {error ? null : orders.length === 0 ? (
        <EmptyState>
          No orders yet. <TextLink to="/cart">Go to cart</TextLink>
        </EmptyState>
      ) : (
        orders.map((order) => (
          <OrderCard
            key={docId(order)}
            order={order}
            productsById={productsById}
            busy={loading}
            onCancel={(id) => void cancel(id)}
          />
        ))
      )}
    </>
  );
}
