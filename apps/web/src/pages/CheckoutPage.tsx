import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AddressFields, emptyDelivery, Button, Flash, Spinner } from '@/components';
import { updateMe } from '@/features/auth';
import { useAuth, useCart, useMoney } from '@/hooks';
import { useAppDispatch } from '@/store/hooks';

export function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, error: authError } = useAuth();
  const { cart, error, loading, productsById, placeOrder } = useCart({
    load: true,
  });
  const money = useMoney();
  const [delivery, setDelivery] = useState(emptyDelivery);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setDelivery({
      phone: user.phone ?? '',
      address: {
        line1: user.address?.line1 ?? '',
        line2: user.address?.line2 ?? '',
        city: user.address?.city ?? '',
        region: user.address?.region ?? '',
        postalCode: user.address?.postalCode ?? '',
        country: user.address?.country ?? 'US',
      },
    });
  }, [user]);

  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => {
    const product = productsById.get(item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const saved = await dispatch(
      updateMe({ phone: delivery.phone, address: delivery.address }),
    );
    if (!updateMe.fulfilled.match(saved)) {
      setBusy(false);
      return;
    }
    const ok = await placeOrder(delivery.address);
    setBusy(false);
    if (ok) {
      navigate('/orders');
    }
  }

  if (loading && !cart) {
    return <Spinner />;
  }

  if (!cart || items.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        Cart is empty.{' '}
        <Link className="font-medium text-emerald-800 hover:underline" to="/shop">
          Shop
        </Link>
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900">
          Checkout
        </h1>
        <p className="mb-6 text-sm text-zinc-500">
          Confirm where this order should ship. Payment is not in this demo.
        </p>
        <Flash>{error || authError}</Flash>
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Shipping address
          </h2>
          <AddressFields value={delivery} onChange={setDelivery} />
          <Button type="submit" className="w-full" disabled={busy || loading}>
            Place order
          </Button>
        </form>
      </div>
      <aside className="h-fit rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Order summary
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-700">
          {items.map((item) => {
            const product = productsById.get(item.productId);
            return (
              <li key={item.productId} className="flex justify-between gap-3">
                <span>
                  {item.quantity} × {product?.name ?? item.productId}
                </span>
                <span className="tabular-nums">
                  {product ? money(product.price * item.quantity) : '—'}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold">
          <span>Total</span>
          <span className="tabular-nums">{money(total)}</span>
        </p>
        <Link
          to="/cart"
          className="mt-4 inline-block text-sm font-medium text-emerald-800 hover:underline"
        >
          Back to cart
        </Link>
      </aside>
    </div>
  );
}
