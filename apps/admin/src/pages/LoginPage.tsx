import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { Button, Field, Flash } from '@/components/ui';
import { useAuth, useStorefront, siteName } from '@/hooks';
import { loginSchema, type LoginFormValues } from '@/lib/schemas';

export function LoginPage() {
  const { error, signIn } = useAuth();
  const { storefront } = useStorefront();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));
  const shopName = siteName(storefront);

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
    const ok = await signIn(values.email.trim(), values.password);
    if (ok) {
      navigate(next);
    }
  }

  return (
    <div className="admin-login d-flex">
      <div className="admin-login-brand d-none d-lg-flex flex-column justify-content-end">
        <p className="small fw-bold text-uppercase mb-2 opacity-75">Staff only</p>
        <h1 className="mb-3">{shopName} admin</h1>
      </div>
      <div className="d-flex flex-grow-1 align-items-center justify-content-center p-4 bg-light">
        <form
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          className="admin-login-card card"
        >
          <div className="card-body">
            <p className="admin-page-eyebrow mb-1">Welcome back</p>
            <h1 className="h3 fw-bold mb-4">Sign in</h1>
            <Flash>{error}</Flash>
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
              hint="At least 8 characters."
              required
              {...register('password')}
              error={errors.password?.message}
            />
            <Button
              type="submit"
              className="w-100 mt-1"
              loading={isSubmitting}
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
