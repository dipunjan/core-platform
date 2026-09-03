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
      <h1>Cart</h1>
      <Flash>{error}</Flash>
      {error ? null : !cart || cart.items.length === 0 ? (
        <EmptyState>
          Empty. <Link to="/">Browse products</Link>
        </EmptyState>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
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
          <p>
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
          </p>
          <p className="muted">
            Redux only mirrors the cart. The server still owns it (your user id comes from the cookie).
          </p>
        </div>
      )}
    </>
  );
}
