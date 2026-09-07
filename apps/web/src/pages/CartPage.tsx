import { useNavigate } from 'react-router-dom';
import { Button, Card, CartLine, EmptyState, Flash, PageLoader, PageTitle, TextLink } from '@/components';
import { useAuth, useCart, useMoney } from '@/hooks';

export function CartPage() {
  const navigate = useNavigate();
  const money = useMoney();
  const { user } = useAuth();
  const { cart, error, loading, productsById, setQty } = useCart({
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
        <PageTitle className="mb-6">Cart</PageTitle>
        <PageLoader label="Loading your cart…" />
      </>
    );
  }

  return (
    <>
      <PageTitle className="mb-6">Cart</PageTitle>
      <Flash>{error}</Flash>
      {error ? null : !cart || cart.items.length === 0 ? (
        <EmptyState>
          Your cart is empty. <TextLink to="/shop">Browse products</TextLink>
        </EmptyState>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto px-4 sm:px-6">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="py-3 pr-4 font-medium">Item</th>
                  <th className="py-3 pr-4 font-medium">Qty</th>
                  <th className="py-3 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <CartLine
                    key={item.productId}
                    item={item}
                    product={productsById.get(item.productId)}
                    busy={loading}
                    onQty={(quantity) => void setQty(item.productId, quantity)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-zinc-100 px-4 py-4 sm:px-6">
            <p className="mb-4 flex justify-between text-base font-semibold text-zinc-900">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(total)}</span>
            </p>
            <Button
              type="button"
              loading={loading}
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
              <p className="mt-3 text-sm text-zinc-500">
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
