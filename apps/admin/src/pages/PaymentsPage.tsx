import { useEffect, useState, type FormEvent } from 'react';
import { Button, Field, Flash, PageHeader, PageLoader, SelectField } from '@/components/ui';
import { usePatchStorefrontMutation, useStorefrontQuery } from '@/query';

const PROVIDERS = [
  { value: 'auto', label: 'Automatic — India uses Razorpay, other countries use Stripe' },
  { value: 'stripe', label: 'Stripe (cards worldwide)' },
  { value: 'razorpay', label: 'Razorpay (India — UPI, cards, net banking)' },
  { value: 'simulate', label: 'Practice mode — no real charges' },
] as const;

export function PaymentsPage() {
  const { data: store, isLoading, error: loadError } = useStorefrontQuery();
  const patchStorefront = usePatchStorefrontMutation();
  const [paymentProvider, setPaymentProvider] = useState('auto');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [razorpayKeyId, setRazorpayKeyId] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!store) {
      return;
    }
    setPaymentProvider(store.paymentProvider ?? 'auto');
    setStripePublishableKey(store.stripePublishableKey ?? '');
    setRazorpayKeyId(store.razorpayKeyId ?? '');
  }, [store]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    setError('');
    try {
      await patchStorefront.mutateAsync({
        paymentProvider,
        stripePublishableKey: stripePublishableKey.trim(),
        razorpayKeyId: razorpayKeyId.trim(),
      });
      setNotice('Payment settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    }
  }

  if (isLoading && !store) {
    return <PageLoader label="Loading payment settings…" />;
  }

  return (
    <>
      <PageHeader title="Payments" />
      <Flash>{loadError?.message || error}</Flash>
      {notice ? <Flash tone="success">{notice}</Flash> : null}

      <form className="card admin-form-card" onSubmit={(event) => void save(event)}>
        <div className="card-body">
          <p className="text-muted small mb-4">
            Choose how customers pay at checkout. The safe keys that customers see on
            the payment screen are set below. Your hosting or developer team sets up
            the private account keys separately — you do not enter those here.
          </p>

          <SelectField
            label="How customers pay"
            value={paymentProvider}
            onChange={(event) => setPaymentProvider(event.target.value)}
          >
            {PROVIDERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>

          <Field
            label="Stripe — public key"
            hint="From your Stripe dashboard (starts with pk_). Used on the card payment screen."
            value={stripePublishableKey}
            onChange={(event) => setStripePublishableKey(event.target.value)}
            autoComplete="off"
          />

          <Field
            label="Razorpay — public key"
            hint="From your Razorpay dashboard (starts with rzp_). Used for India checkout."
            value={razorpayKeyId}
            onChange={(event) => setRazorpayKeyId(event.target.value)}
            autoComplete="off"
          />

          <Button
            type="submit"
            loading={patchStorefront.isPending}
            loadingLabel="Saving…"
          >
            Save payment settings
          </Button>
        </div>
      </form>
    </>
  );
}
