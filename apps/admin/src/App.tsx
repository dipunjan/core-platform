import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuth, useStorefront } from '@/hooks';
import { router } from '@/routes';

export function App() {
  const { loadMe } = useAuth();
  const { loadStorefront } = useStorefront();

  useEffect(() => {
    void loadMe();
    void loadStorefront();
  }, [loadMe, loadStorefront]);

  return <RouterProvider router={router} />;
}
