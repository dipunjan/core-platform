import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import {
  AddressFields,
  AuthCard,
  Button,
  Field,
  Flash,
  TextLink,
} from '@/components';
import { useAuth } from '@/hooks';
import {
  emptyDeliveryValues,
  registerSchema,
  type RegisterFormValues,
} from '@/lib/schemas';

export function RegisterPage() {
  const { signUp, error } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: 'Ada',
      email: '',
      password: 'secret12',
      ...emptyDeliveryValues,
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    const ok = await signUp({
      email: values.email,
      name: values.name,
      password: values.password,
      phone: values.phone,
      address: values.address,
    });
    if (ok) {
      navigate(next === '/' ? '/' : next);
    }
  }

  const loginTo = next === '/' ? '/login' : `/login?next=${encodeURIComponent(next)}`;

  return (
    <AuthCard
      wide
      title="Create account"
      footer={
        <>
          Already have an account? <TextLink to={loginTo}>Log in</TextLink>
        </>
      }
    >
      <Flash>{error}</Flash>
      <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
        <Field
          label="Name"
          autoComplete="name"
          required
          {...register('name')}
          error={errors.name?.message}
        />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          {...register('email')}
          error={errors.email?.message}
        />
        <Field
          label="Password (min 8)"
          type="password"
          autoComplete="new-password"
          required
          {...register('password')}
          error={errors.password?.message}
        />
        <AddressFields register={register} errors={errors} />
        <Button
          type="submit"
          className="w-100"
          loading={isSubmitting}
          loadingLabel="Creating account…"
        >
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
