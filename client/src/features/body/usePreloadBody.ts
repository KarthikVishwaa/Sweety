import { useEffect } from 'react';
import { getBodyGeometry } from './bodyGeometry';
import { BODY_MODELS } from './bodyProportions';
import { useWebGLSupport } from './useWebGLSupport';

// Fetches the 3D code and builds both figures in the background, so the next screen shows them at once.
export function usePreloadBody(enabled: boolean): void {
  const supported = useWebGLSupport();

  useEffect(() => {
    if (!enabled || !supported) return;
    void import('./BodyGlucoseScene').catch(() => undefined);
    for (const model of BODY_MODELS) void getBodyGeometry(model).catch(() => undefined);
  }, [enabled, supported]);
}
