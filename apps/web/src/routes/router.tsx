import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GuestRoute, Layout, ProtectedRoute } from '@/components';
import {
  CartPage,
  HomePage,
  LoginPage,
  OrdersPage,
  ProductPage,
  RegisterPage,
} from '@/pages';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/products/:id', element: <ProductPage /> },
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
          { path: '/cart', element: <CartPage /> },
          { path: '/orders', element: <OrdersPage /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
