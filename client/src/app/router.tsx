import { createBrowserRouter } from 'react-router-dom';
import { GuestRoute } from '@/features/auth/GuestRoute';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SignupPage } from '@/pages/SignupPage';

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [{ path: '/', element: <DashboardPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
]);
