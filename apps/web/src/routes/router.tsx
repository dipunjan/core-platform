import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GuestRoute, Layout, PageLoader, ProtectedRoute, RouteError } from '@/components';
import {
  AccountPage,
  CartPage,
  CheckoutPage,
  HomePage,
  LoginPage,
  ProductPage,
  RegisterPage,
  ShopPage,
} from '@/pages';

const CheckoutPayPage = lazy(() =>
  import('@/pages/CheckoutPayPage').then((m) => ({ default: m.CheckoutPayPage })),
);

export const router = createBrowserRouter([
  {
    errorElement: <RouteError />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            errorElement: <RouteError />,
            children: [
              { path: '/', element: <HomePage /> },
              { path: '/shop', element: <ShopPage /> },
              { path: '/shop/:category', element: <ShopPage /> },
              { path: '/products/:id', element: <ProductPage /> },
              { path: '/cart', element: <CartPage /> },
              {
                element: <GuestRoute />,
                children: [
                  { path: '/login', element: <LoginPage /> },
                  { path: '/register', element: <RegisterPage /> },
                ],
              },
              {
                element: <ProtectedRoute />,
                children: [
                  { path: '/checkout', element: <CheckoutPage /> },
                  { path: '/checkout/pay/:orderId', element: (
                    <Suspense fallback={<PageLoader label="Loading payment…" />}>
                      <CheckoutPayPage />
                    </Suspense>
                  ) },
                  { path: '/account', element: <AccountPage /> },
                  { path: '/orders', element: <Navigate to="/account?tab=orders" replace /> },
                ],
              },
              { path: '*', element: <Navigate to="/" replace /> },
            ],
          },
        ],
      },
    ],
  },
]);
