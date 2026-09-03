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
    <div className="card" style={{ maxWidth: 420 }}>
      <h1>Register</h1>
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
        <Button type="submit" disabled={busy}>
          Create account
        </Button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
