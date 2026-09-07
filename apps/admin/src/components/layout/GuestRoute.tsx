import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { safeNext } from '@/api';
import { useAuth } from '@/hooks';
import { Spinner } from '@/components/ui';

export function GuestRoute() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'));

  if (loading) {
    return <Spinner />;
  }
  if (user?.role === 'admin') {
    return <Navigate to={next} replace />;
  }
  return <Outlet />;
}
