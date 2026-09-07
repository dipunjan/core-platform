import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { Button, Field, Flash } from '@/components/ui';
import { useAuth } from '@/hooks';

export function LoginPage() {
  const { error, signIn } = useAuth();
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
      <form
        onSubmit={(event) => void onSubmit(event)}
        className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          Staff sign in
        </h1>
        <p className="mt-2 mb-6 text-sm text-zinc-500">
          Same accounts as the shop. Only the email in ADMIN_EMAIL (default Ada)
          is treated as admin.
        </p>
        <Flash>{error}</Flash>
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
          required
        />
        <Button type="submit" className="w-full" disabled={busy}>
          Log in
        </Button>
      </form>
    </div>
  );
}
