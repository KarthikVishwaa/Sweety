import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogout, useMe } from '@/features/auth/useAuth';

export function DashboardPage() {
  const { data: user } = useMe();
  const logout = useLogout();

  return (
    <header className="mx-auto flex max-w-3xl items-center justify-between p-6">
      <h1 className="text-2xl font-semibold">Hello, {user?.name}</h1>
      <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
        <LogOut aria-hidden="true" />
        Logout
      </Button>
    </header>
  );
}
