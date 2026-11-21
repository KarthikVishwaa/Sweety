import { Navigate, Outlet } from 'react-router-dom';
import { PageSkeleton } from '@/components/layout/PageSkeleton';
import { useMe } from './useAuth';

export function GuestRoute() {
  const { data: user, isPending } = useMe();

  if (isPending) return <PageSkeleton />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
