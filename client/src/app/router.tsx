import { createBrowserRouter } from 'react-router-dom';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { RootLayout } from '@/components/layout/RootLayout';
import { GuestRoute } from '@/features/auth/GuestRoute';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    HydrateFallback: PageSkeleton,
    children: [
      {
        element: <GuestRoute />,
        children: [
          {
            path: '/login',
            lazy: async () => ({ Component: (await import('@/pages/LoginPage')).LoginPage }),
          },
        ],
      },
      {
        path: '/signup',
        lazy: async () => ({
          Component: (await import('@/pages/OnboardingPage')).OnboardingPage,
        }),
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/history',
            lazy: async () => ({ Component: (await import('@/pages/HistoryPage')).HistoryPage }),
          },
          {
            path: '/',
            lazy: async () => ({
              Component: (await import('@/pages/DashboardPage')).DashboardPage,
            }),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
