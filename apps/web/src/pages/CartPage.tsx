import { useNavigate } from 'react-router-dom';
import { Button, Card, CartLine, EmptyState, Flash, PageLoader, PageTitle, TextLink } from '@/components';
import { useAuth, useCart, useMoney } from '@/hooks';

export function CartPage() {
  const navigate = useNavigate();
  const money = useMoney();
  const { user } = useAuth();
  const { cart, error, loading, mutating, productsById, setQty } = useCart({
    load: true,
  });

  const total =
    cart?.items.reduce((sum, item) => {
      const product = productsById.get(item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0) ?? 0;

  if (loading && !cart) {
    return (
      <>
        <PageTitle className="mb-4">Cart</PageTitle>
        <PageLoader label="Loading your cart…" />
      </>
    );
  }

  return (
    <>
      <PageTitle className="mb-4">Cart</PageTitle>
      <Flash>{error}</Flash>
      {error ? null : !cart || cart.items.length === 0 ? (
        <EmptyState>
          Your cart is empty. <TextLink to="/shop">Browse products</TextLink>
        </EmptyState>
      ) : (
        <Card padding="none">
          <div className="table-responsive px-3 px-sm-4 pt-3">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr className="text-muted text-uppercase small">
                  <th scope="col">Item</th>
                  <th scope="col">Qty</th>
                  <th scope="col" className="text-end">Price</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <CartLine
                    key={item.productId}
                    item={item}
                    product={productsById.get(item.productId)}
                    busy={mutating}
                    onQty={(quantity) => void setQty(item.productId, quantity)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-top px-3 px-sm-4 py-3">
            <p className="d-flex justify-content-between fw-semibold mb-3">
              <span>Subtotal</span>
              <span className="font-monospace">{money(total)}</span>
            </p>
            <Button
              type="button"
              onClick={() => {
                if (user) {
                  navigate('/checkout');
                  return;
                }
                navigate('/login?next=/checkout');
              }}
            >
              {user ? 'Proceed to checkout' : 'Sign in to check out'}
            </Button>
            {!user ? (
              <p className="mt-3 mb-0 text-muted small">
                You can add items without an account. Sign in is required to
                place the order.
              </p>
            ) : null}
          </div>
        </Card>
      )}
    </>
  );
}
