import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useAuth, useCatalog } from '@/hooks';
import { router } from '@/routes';

export function App() {
  const { loadMe } = useAuth();
  const { loadStorefront } = useCatalog();

  useEffect(() => {
    void loadMe();
    loadStorefront();
  }, [loadMe, loadStorefront]);

  return <RouterProvider router={router} />;
}
