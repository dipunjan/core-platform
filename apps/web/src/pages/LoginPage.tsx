import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { Button, Field, Flash } from '@/components';
import { useAuth } from '@/hooks';

export function LoginPage() {
  const { signIn, error } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('ada@example.com');
  const [password, setPassword] = useState('secret12');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const ok = await signIn(email, password);
    setBusy(false);
    if (ok) {
      navigate(next);
    }
  }

  const registerTo =
    next === '/' ? '/register' : `/register?next=${encodeURIComponent(next)}`;

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        {next === '/checkout' ? 'Sign in to check out' : 'Log in'}
      </h1>
      <p className="mt-2 mb-6 text-sm text-zinc-500">
        {next === '/checkout'
          ? 'Your cart stays with you. Sign in or create an account to place the order.'
          : 'Welcome back. Use the email and password for your account.'}
      </p>
      <Flash>{error}</Flash>
      <form onSubmit={(event) => void onSubmit(event)}>
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Button type="submit" className="w-full" disabled={busy}>
          Log in
        </Button>
      </form>
      <p className="mt-6 text-sm text-zinc-600">
        No account?{' '}
        <Link
          className="font-medium text-emerald-800 hover:underline"
          to={registerTo}
        >
          Register
        </Link>
      </p>
    </div>
  );
}
