import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GuestRoute, Layout, ProtectedRoute, RouteError } from '@/components';
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
