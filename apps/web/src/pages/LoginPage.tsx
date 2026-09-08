import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { AuthCard, Button, Field, Flash, TextLink } from '@/components';
import { useAuth } from '@/hooks';
import { loginSchema, type LoginFormValues } from '@/lib/schemas';

export function LoginPage() {
  const { signIn, error } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'ada@example.com',
      password: 'secret12',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    const ok = await signIn(values.email, values.password);
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
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          {...register('email')}
          error={errors.email?.message}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          {...register('password')}
          error={errors.password?.message}
        />
        <Button
          type="submit"
          className="w-100"
          loading={isSubmitting}
          loadingLabel="Signing in…"
        >
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
