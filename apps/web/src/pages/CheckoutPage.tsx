import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  AddressFields,
  Button,
  Card,
  EmptyState,
  Flash,
  PageTitle,
  PageLoader,
  TextLink,
} from '@/components';
import { useUpdateMeMutation } from '@/query';
import { useAuth, useCart, useMoney } from '@/hooks';
import { deliverySchema, emptyDeliveryValues, type DeliveryFormValues } from '@/lib/schemas';

export function CheckoutPage() {
  const navigate = useNavigate();
  const updateMe = useUpdateMeMutation();
  const { user, error: authError } = useAuth();
  const { cart, error, loading, productsById, placeOrder } = useCart({
    load: true,
  });
  const money = useMoney();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DeliveryFormValues>({
    resolver: zodResolver(deliverySchema),
    defaultValues: emptyDeliveryValues,
  });

  useEffect(() => {
    if (!user) {
      return;
    }
    reset({
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
  }, [reset, user]);

  const items = cart?.items ?? [];
  const total = items.reduce((sum, item) => {
    const product = productsById.get(item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);

  async function onSubmit(values: DeliveryFormValues) {
    try {
      await updateMe.mutateAsync({
        phone: values.phone,
        address: values.address,
      });
    } catch {
      return;
    }
    const ok = await placeOrder(values.address);
    if (ok) {
      navigate('/account?tab=orders', { state: { orderPlaced: true } });
    }
  }

  if (loading && !cart) {
    return <PageLoader label="Loading checkout…" />;
  }

  if (!cart || items.length === 0) {
    return (
      <>
        <PageTitle className="mb-4">Checkout</PageTitle>
        <EmptyState>
          Your cart is empty. <TextLink to="/shop">Browse products</TextLink>
        </EmptyState>
      </>
    );
  }

  return (
    <div className="row g-4">
      <div className="col-lg">
        <PageTitle className="mb-4">Checkout</PageTitle>
        <Flash>{error || authError || updateMe.error?.message}</Flash>
        <Card as="form" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <h2 className="h5 fw-semibold mb-3">Shipping address</h2>
          <AddressFields register={register} errors={errors} />
          <Button
            type="submit"
            className="w-100"
            loading={isSubmitting || loading}
            loadingLabel="Placing order…"
          >
            Place order
          </Button>
        </Card>
      </div>
      <div className="col-lg-auto">
        <Card as="aside" padding="sm" style={{ minWidth: '20rem' }}>
          <h2 className="small fw-semibold text-uppercase text-muted">
            Order summary
          </h2>
          <ul className="list-unstyled mt-3 mb-0 small text-muted">
            {items.map((item) => {
              const product = productsById.get(item.productId);
              return (
                <li key={item.productId} className="d-flex justify-content-between gap-3 mb-2">
                  <span>
                    {item.quantity} × {product?.name ?? item.productId}
                  </span>
                  <span className="font-monospace">
                    {product ? money(product.price * item.quantity) : '—'}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="d-flex justify-content-between fw-semibold border-top pt-3 mt-3 mb-0">
            <span>Total</span>
            <span className="font-monospace">{money(total)}</span>
          </p>
          <TextLink to="/cart" className="d-inline-block mt-3 small">
            Back to cart
          </TextLink>
        </Card>
      </div>
    </div>
  );
}
