import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { Spinner } from '@/components/ui';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Spinner />;
  }
  if (!user || user.role !== 'admin') {
    const next = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />
    );
  }
  return <Outlet />;
}
