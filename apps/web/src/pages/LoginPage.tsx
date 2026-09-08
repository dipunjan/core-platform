import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { AuthCard, Button, Field, Flash, TextLink } from '@/components';
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
    <AuthCard
      title={next === '/checkout' ? 'Sign in to check out' : 'Log in'}
      footer={
        <>
          No account? <TextLink to={registerTo}>Register</TextLink>
        </>
      }
    >
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
        <Button type="submit" className="w-100" loading={busy} loadingLabel="Signing in…">
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
