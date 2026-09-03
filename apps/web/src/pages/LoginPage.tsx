import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Field, Flash } from '@/components';
import { useAuth } from '@/hooks';

export function LoginPage() {
  const { signIn, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('ada@example.com');
  const [password, setPassword] = useState('secret12');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const ok = await signIn(email, password);
    setBusy(false);
    if (ok) {
      navigate('/');
    }
  }

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h1>Log in</h1>
      <p className="muted">Uses cookies. Redux only keeps a copy of your name — the real cart lives on the server.</p>
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
        <Button type="submit" disabled={busy}>
          Log in
        </Button>
      </form>
      <p>
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
