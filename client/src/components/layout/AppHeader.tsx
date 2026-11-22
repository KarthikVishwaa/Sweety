import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';
import { UserMenu } from '@/components/layout/UserMenu';
import { buttonVariants } from '@/components/ui/button';
import { useLogout, useMe } from '@/features/auth/useAuth';
import { ProfileDialog } from '@/features/profile/ProfileDialog';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/history', label: 'History', end: false },
];

export function AppHeader({ heading }: { heading: string }) {
  const logout = useLogout();
  const { data: user } = useMe();
  const [profileOpen, setProfileOpen] = useState(false);

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
        {user && (
          <UserMenu
            name={user.name}
            onProfile={() => setProfileOpen(true)}
            onLogout={() => logout.mutate()}
            loggingOut={logout.isPending}
          />
        )}
      </nav>
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
}
