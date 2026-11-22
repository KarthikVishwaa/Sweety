import { Menu } from '@base-ui/react/menu';
import { ChevronDown, CircleUser, LogOut, UserRound } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UserMenuProps {
  name: string;
  onProfile: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}

const ITEM =
  'flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted [&_svg]:size-4';

// The account menu in the header: the profile (where the figure can be changed) and logging out.
export function UserMenu({ name, onProfile, onLogout, loggingOut }: UserMenuProps) {
  const firstName = name.trim().split(/\s+/)[0] ?? name;

  return (
    <Menu.Root>
      <Menu.Trigger className={cn(buttonVariants({ variant: 'outline' }), 'gap-1.5')}>
        <CircleUser aria-hidden="true" />
        <span className="max-w-32 truncate">{firstName}</span>
        <ChevronDown aria-hidden="true" className="opacity-60" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" sideOffset={6} className="z-50">
          <Menu.Popup className="min-w-44 rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none">
            <Menu.Item className={ITEM} onClick={onProfile}>
              <UserRound aria-hidden="true" />
              Profile
            </Menu.Item>
            <Menu.Item className={ITEM} onClick={onLogout} disabled={loggingOut}>
              <LogOut aria-hidden="true" />
              Log out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
