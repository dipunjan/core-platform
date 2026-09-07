import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { fetchCart } from '@/features/cart';
import { useAuth, useCatalog } from '@/hooks';
import { useAppDispatch } from '@/store/hooks';
import { router } from '@/routes';

export function App() {
  const dispatch = useAppDispatch();
  const { loadMe } = useAuth();
  const { loadStorefront } = useCatalog();

  useEffect(() => {
    void loadMe();
    loadStorefront();
    void dispatch(fetchCart());
  }, [dispatch, loadMe, loadStorefront]);

  return <RouterProvider router={router} />;
}
