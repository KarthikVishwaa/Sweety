import { LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { Button, buttonVariants } from '@/components/ui/button';
import { useLogout } from '@/features/auth/useAuth';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/history', label: 'History', end: false },
];

export function AppHeader({ heading }: { heading: string }) {
  const logout = useLogout();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <Logo />
        <h1 className="text-2xl font-semibold">{heading}</h1>
      </div>
      <nav aria-label="Main" className="flex items-center gap-1">
        {NAV_ITEMS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(buttonVariants({ variant: 'ghost' }), isActive && 'bg-muted font-semibold')
            }
          >
            {label}
          </NavLink>
        ))}
        <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut aria-hidden="true" />
          Logout
        </Button>
      </nav>
    </header>
  );
}
