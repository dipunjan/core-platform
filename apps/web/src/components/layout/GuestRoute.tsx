import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { useAuth } from '@/hooks';
import { PageLoader } from '@/components/ui';

export function GuestRoute() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  if (loading) {
    return <PageLoader label="Checking your session…" />;
  }
  if (user) {
    return <Navigate to={next} replace />;
  }
  return <Outlet />;
}
