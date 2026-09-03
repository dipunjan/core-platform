import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Spinner } from '@/components/ui';

export function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
