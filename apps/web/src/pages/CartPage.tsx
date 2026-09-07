import { useNavigate } from 'react-router-dom';
import { Button, Card, CartLine, EmptyState, Flash, PageTitle, TextLink } from '@/components';
import { useAuth, useCart } from '@/hooks';

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, error, loading, productsById, setQty } = useCart({
    load: true,
  });

  return (
    <>
      <PageTitle className="mb-6">Cart</PageTitle>
      <Flash>{error}</Flash>
      {error ? null : !cart || cart.items.length === 0 ? (
        <EmptyState>
          Empty. <TextLink to="/shop">Browse products</TextLink>
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
            <Button
              type="button"
              disabled={loading}
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
