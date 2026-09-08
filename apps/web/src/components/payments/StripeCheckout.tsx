import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useMemo, useState } from 'react';
import { Button, Flash } from '@/components/ui';

function StripePaymentForm({
  orderId,
  onPaid,
}: {
  orderId: string;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function pay() {
    if (!stripe || !elements) {
      return;
    }
    setBusy(true);
    setError('');
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/pay/${orderId}?paid=1`,
      },
      redirect: 'if_required',
    });
    setBusy(false);
    if (result.error) {
      setError(result.error.message ?? 'Payment failed');
      return;
    }
    if (result.paymentIntent?.status === 'succeeded') {
      onPaid();
    }
  }

  return (
    <div>
      <PaymentElement />
      <div className="mt-3">
        <Flash>{error}</Flash>
      </div>
      <Button
        type="button"
        className="w-100 mt-3"
        loading={busy}
        loadingLabel="Processing…"
        onClick={() => void pay()}
      >
        Pay now
      </Button>
    </div>
  );
}

export function StripeCheckout({
  publishableKey,
  clientSecret,
  orderId,
  onPaid,
}: {
  publishableKey: string;
  clientSecret: string;
  orderId: string;
  onPaid: () => void;
}) {
  const stripePromise = useMemo(
    () => loadStripe(publishableKey),
    [publishableKey],
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm orderId={orderId} onPaid={onPaid} />
    </Elements>
  );
}
