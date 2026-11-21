import logoSize from '@/assets/logo.json';
import logo from '@/assets/logo.webp';
import logoRetina from '@/assets/logo@2x.webp';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src={logo}
      srcSet={`${logo} 1x, ${logoRetina} 2x`}
      width={logoSize.width}
      height={logoSize.height}
      alt="Sweety"
      className={cn(
        'h-8 w-auto mix-blend-multiply dark:rounded-lg dark:bg-white dark:mix-blend-normal',
        className,
      )}
    />
  );
}
