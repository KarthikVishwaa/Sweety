import type { ReactNode } from 'react';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[90rem] 3xl:max-w-[100rem] space-y-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 xl:px-10">
      {children}
    </div>
  );
}
