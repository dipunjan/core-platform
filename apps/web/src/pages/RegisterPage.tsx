import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { AddressFields, emptyDelivery, Button, Field, Flash } from '@/components';
import { useAuth } from '@/hooks';

export function RegisterPage() {
  const { signUp, error } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [name, setName] = useState('Ada');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('secret12');
  const [delivery, setDelivery] = useState(emptyDelivery);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const ok = await signUp({
      email,
      name,
      password,
      phone: delivery.phone,
      address: delivery.address,
    });
    setBusy(false);
    if (ok) {
      navigate(next === '/' ? '/' : next);
    }
  }

  const loginTo = next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`;

  return (
    <div className="mx-auto w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Create account
      </h1>
      <p className="mt-2 mb-6 text-sm text-zinc-500">
        Name, email, password, mobile, and a shipping address. You will
        confirm the address again at checkout.
      </p>
      <Flash>{error}</Flash>
      <form onSubmit={(event) => void onSubmit(event)}>
        <Field
          label="Name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password (min 8)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <AddressFields value={delivery} onChange={setDelivery} />
        <Button type="submit" className="w-full" disabled={busy}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm text-zinc-600">
        Already have an account?{' '}
        <Link className="font-medium text-emerald-800 hover:underline" to={loginTo}>
          Log in
        </Link>
      </p>
    </div>
  );
}
