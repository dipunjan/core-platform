import { createBrowserRouter, Navigate } from 'react-router-dom';
import { GuestRoute, Layout, ProtectedRoute, RouteError } from '@/components';
import {
  BrandingPage,
  CategoriesPage,
  InventoryPage,
  LoginPage,
  PeoplePage,
  ProductsPage,
  SalesPage,
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
              {
                element: <GuestRoute />,
                children: [{ path: '/login', element: <LoginPage /> }],
              },
              {
                element: <ProtectedRoute />,
                children: [
                  { path: '/', element: <SalesPage /> },
                  { path: '/branding', element: <BrandingPage /> },
                  { path: '/people', element: <PeoplePage /> },
                  { path: '/products', element: <ProductsPage /> },
                  { path: '/categories', element: <CategoriesPage /> },
                  { path: '/inventory', element: <InventoryPage /> },
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
