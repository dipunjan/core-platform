import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { Button, Field, Flash } from '@/components/ui';
import { useAuth, useStorefront, siteName } from '@/hooks';

export function LoginPage() {
  const { error, signIn } = useAuth();
  const { storefront } = useStorefront();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('ada@example.com');
  const [password, setPassword] = useState('secret12');
  const [busy, setBusy] = useState(false);
  const [emailError, setEmailError] = useState('');
  const shopName = siteName(storefront);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setEmailError('');
    if (!email.trim()) {
      setEmailError('Enter your email address.');
      return;
    }
    setBusy(true);
    const ok = await signIn(email.trim(), password);
    setBusy(false);
    if (ok) {
      navigate(next);
    }
  }

  return (
    <div className="admin-login d-flex">
      <div className="admin-login-brand d-none d-lg-flex flex-column justify-content-end">
        <p className="small fw-bold text-uppercase mb-2 opacity-75">Staff only</p>
        <h1 className="mb-3">{shopName} admin</h1>
        <p className="lead mb-0 opacity-90" style={{ maxWidth: '22rem' }}>
          Manage products, inventory, branding, and people — everything shoppers see on the storefront.
        </p>
      </div>
      <div className="d-flex flex-grow-1 align-items-center justify-content-center p-4 bg-light">
        <form
          onSubmit={(event) => void onSubmit(event)}
          className="admin-login-card card"
        >
          <div className="card-body">
            <p className="admin-page-eyebrow mb-1">Welcome back</p>
            <h1 className="h3 fw-bold mb-2">Sign in</h1>
            <p className="text-muted mb-4">
              Use your staff account. Same email and password as the shop.
            </p>
            <Flash>{error}</Flash>
            <Field
              label="Email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailError}
              required
            />
            <Field
              label="Password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="At least 8 characters."
              minLength={8}
              required
            />
            <Button
              type="submit"
              className="w-100 mt-1"
              loading={busy}
              loadingLabel="Signing in…"
            >
              Log in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
