import { useReducedMotion } from 'motion/react';
import { Suspense, lazy, useState } from 'react';
import { cn } from '@/lib/utils';
import { BodyGaugeBoundary } from './BodyGaugeBoundary';
import { BodyGaugeFallback } from './BodyGaugeFallback';
import type { Gender } from './bodyProportions';
import { useWebGLSupport } from './useWebGLSupport';

// three.js is only downloaded when a figure is actually shown.
const BodyGlucoseScene = lazy(() => import('./BodyGlucoseScene'));

interface BodyGlucoseGaugeProps {
  model: Gender;
  value: number | null;
  className?: string;
}

// Decorative: the meaning is always given as text next to it by the page.
export function BodyGlucoseGauge({ model, value, className }: BodyGlucoseGaugeProps) {
  const webGLSupported = useWebGLSupport();
  const reducedMotion = useReducedMotion() ?? false;
  const [contextLost, setContextLost] = useState(false);
  const fallback = <BodyGaugeFallback value={value} />;

  return (
    <div aria-hidden="true" className={cn('relative h-full w-full', className)}>
      {webGLSupported ? (
        <BodyGaugeBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <BodyGlucoseScene
              model={model}
              value={value}
              reducedMotion={reducedMotion}
              onContextLost={() => setContextLost(true)}
              onContextRestored={() => setContextLost(false)}
            />
          </Suspense>
        </BodyGaugeBoundary>
      ) : (
        fallback
      )}
      {/* The canvas stays mounted while the context is lost, so three.js can rebuild it when the browser restores it. */}
      {webGLSupported && contextLost && <div className="absolute inset-0">{fallback}</div>}
    </div>
  );
}
