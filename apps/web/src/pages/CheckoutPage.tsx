import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AddressFields,
  emptyDelivery,
  Button,
  Card,
  EmptyState,
  Flash,
  PageTitle,
  PageLoader,
  TextLink,
} from '@/components';
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
      navigate('/orders', { state: { orderPlaced: true } });
    }
  }

  if (loading && !cart) {
    return <PageLoader label="Loading checkout…" />;
  }

  if (!cart || items.length === 0) {
    return (
      <>
        <PageTitle className="mb-6">Checkout</PageTitle>
        <EmptyState>
          Your cart is empty. <TextLink to="/shop">Browse products</TextLink>
        </EmptyState>
      </>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <PageTitle
          className="mb-6"
          subtitle="Confirm where this order should ship. Payment is not in this demo."
        >
          Checkout
        </PageTitle>
        <Flash>{error || authError}</Flash>
        <Card as="form" onSubmit={(event) => void onSubmit(event)}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Shipping address
          </h2>
          <AddressFields value={delivery} onChange={setDelivery} />
          <Button
            type="submit"
            className="w-full"
            loading={busy || loading}
            loadingLabel="Placing order…"
          >
            Place order
          </Button>
        </Card>
      </div>
      <Card as="aside" padding="sm" className="h-fit">
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
        <TextLink to="/cart" className="mt-4 inline-block text-sm">
          Back to cart
        </TextLink>
      </Card>
    </div>
  );
}
