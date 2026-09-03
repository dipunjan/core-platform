import { Link, useNavigate } from 'react-router-dom';
import { Button, CartLine, EmptyState, Flash } from '@/components';
import { useCart } from '@/hooks';

export function CartPage() {
  const navigate = useNavigate();
  const { cart, error, loading, productsById, setQty, placeOrder } = useCart({
    load: true,
  });

  return (
    <>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-zinc-900">
        Cart
      </h1>
      <Flash>{error}</Flash>
      {error ? null : !cart || cart.items.length === 0 ? (
        <EmptyState>
          Empty.{' '}
          <Link className="font-medium text-emerald-800 hover:underline" to="/">
            Browse products
          </Link>
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
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
                void placeOrder().then((ok) => {
                  if (ok) {
                    navigate('/orders');
                  }
                });
              }}
            >
              Place order
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
