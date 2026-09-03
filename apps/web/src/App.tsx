import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { router } from '@/routes';

export function App() {
  const { loadMe } = useAuth();

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  return <RouterProvider router={router} />;
}
