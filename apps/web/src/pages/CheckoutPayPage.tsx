import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Flash,
  PageLoader,
  PageTitle,
  TextLink,
} from '@/components';
import { useMoney } from '@/hooks';
import {
  useClearCartAfterPaymentMutation,
  useOrderQuery,
  usePaymentCheckoutMutation,
  useSimulatePaymentMutation,
  type PaymentCheckout,
} from '@/query';
import { docId, queryError } from '@/api';

const StripeCheckoutLazy = lazy(() =>
  import('@/components/payments/StripeCheckout').then((m) => ({
    default: m.StripeCheckout,
  })),
);

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Razorpay'));
    document.body.appendChild(script);
  });
}

export function CheckoutPayPage() {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const money = useMoney();
  const orderQuery = useOrderQuery(orderId);
  const checkout = usePaymentCheckoutMutation();
  const simulate = useSimulatePaymentMutation();
  const clearCart = useClearCartAfterPaymentMutation();
  const [session, setSession] = useState<PaymentCheckout | null>(null);
  const [error, setError] = useState('');
  const paidFromRedirect = new URLSearchParams(window.location.search).get('paid');

  const order = orderQuery.data;

  useEffect(() => {
    if (!orderId || !order) {
      return;
    }
    if (order.status === 'paid' || paidFromRedirect === '1') {
      void clearCart.mutateAsync().finally(() => {
        navigate('/account?tab=orders', { state: { orderPlaced: true }, replace: true });
      });
    }
  }, [clearCart, navigate, order, orderId, paidFromRedirect]);

  useEffect(() => {
    if (!orderId || !order || order.status === 'paid' || session) {
      return;
    }
    void checkout
      .mutateAsync(orderId)
      .then((data) => {
        setSession(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not start payment');
      });
  }, [checkout, order, orderId, session]);

  async function completeDemoPayment() {
    setError('');
    try {
      await simulate.mutateAsync(orderId);
      navigate('/account?tab=orders', { state: { orderPlaced: true } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  }

  async function openRazorpay(data: Extract<PaymentCheckout, { provider: 'razorpay' }>) {
    setError('');
    try {
      await loadRazorpayScript();
      if (!window.Razorpay) {
        throw new Error('Razorpay is unavailable');
      }
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'Swoop',
        description: `Order ${data.orderId}`,
        handler: () => {
          void clearCart.mutateAsync().finally(() => {
            navigate('/account?tab=orders', { state: { orderPlaced: true } });
          });
        },
        modal: {
          ondismiss: () => setError('Payment cancelled'),
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open Razorpay');
    }
  }

  function onPaid() {
    void clearCart.mutateAsync().finally(() => {
      navigate('/account?tab=orders', { state: { orderPlaced: true } });
    });
  }

  if (orderQuery.isLoading || !order) {
    return <PageLoader label="Loading payment…" />;
  }

  if (order.status === 'paid') {
    return <PageLoader label="Finishing up…" />;
  }

  const loadingSession = checkout.isPending && !session;
  const stripeSession =
    session?.provider === 'stripe' ? session : null;

  return (
    <div className="row justify-content-center">
      <div className="col-lg-7">
        <PageTitle className="mb-4">Payment</PageTitle>
        <Flash>{error || queryError(checkout.error)}</Flash>
        <Card>
          <p className="text-muted small mb-1">Order</p>
          <p className="font-monospace small mb-3">{docId(order)}</p>
          <p className="d-flex justify-content-between fw-semibold mb-4">
            <span>Total due</span>
            <span className="font-monospace">{money(order.total)}</span>
          </p>

          {loadingSession ? (
            <PageLoader label="Preparing checkout…" />
          ) : null}

          {session?.provider === 'simulate' ? (
            <div>
              <p className="small text-muted mb-3">
                Demo mode — no payment gateway keys are configured. Use this to
                complete checkout locally.
              </p>
              <Button
                type="button"
                className="w-100"
                loading={simulate.isPending}
                loadingLabel="Confirming…"
                onClick={() => void completeDemoPayment()}
              >
                Pay now (demo)
              </Button>
            </div>
          ) : null}

          {stripeSession ? (
            <Suspense fallback={<PageLoader label="Loading Stripe…" />}>
              <StripeCheckoutLazy
                publishableKey={stripeSession.publishableKey}
                clientSecret={stripeSession.clientSecret}
                orderId={orderId}
                onPaid={onPaid}
              />
            </Suspense>
          ) : null}

          {session?.provider === 'razorpay' ? (
            <div>
              <p className="small text-muted mb-3">
                You will be redirected to Razorpay to complete payment (UPI, cards,
                netbanking).
              </p>
              <Button
                type="button"
                className="w-100"
                onClick={() => void openRazorpay(session)}
              >
                Pay with Razorpay
              </Button>
            </div>
          ) : null}

          <TextLink to="/account?tab=orders" className="d-inline-block mt-4 small">
            View orders
          </TextLink>
        </Card>
      </div>
    </div>
  );
}
