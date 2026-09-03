import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, Flash } from '@/components';
import { useAuth } from '@/hooks';

export function RegisterPage() {
  const { signUp, error } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('Ada');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('secret12');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const ok = await signUp(email, name, password);
    setBusy(false);
    if (ok) {
      navigate('/');
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        Register
      </h1>
      <p className="mt-2 mb-6 text-sm text-zinc-500">
        Create an account to save a cart and place orders.
      </p>
      <Flash>{error}</Flash>
      <form onSubmit={(event) => void onSubmit(event)}>
        <Field
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password (min 8)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Button type="submit" className="w-full" disabled={busy}>
          Create account
        </Button>
      </form>
      <p className="mt-6 text-sm text-zinc-600">
        Already have an account?{' '}
        <Link className="font-medium text-emerald-800 hover:underline" to="/login">
          Log in
        </Link>
      </p>
    </div>
  );
}
