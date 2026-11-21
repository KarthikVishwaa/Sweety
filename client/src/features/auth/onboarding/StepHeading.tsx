import { useEffect, useRef, type ReactNode } from 'react';

interface StepHeadingProps {
  description?: string;
  focusOnMount: boolean;
  children: ReactNode;
}

export function StepHeading({ description, focusOnMount, children }: StepHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus();
  }, [focusOnMount]);

  return (
    <div className="space-y-1">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
        {children}
      </h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
