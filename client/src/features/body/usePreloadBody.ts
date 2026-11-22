import { useEffect } from 'react';
import { getBodyGeometry } from './bodyGeometry';
import type { Gender } from './bodyProportions';
import { useWebGLSupport } from './useWebGLSupport';

// Fetches the 3D code and the given figures in the background, so the next screen shows them at once.
export function usePreloadBody(genders: readonly Gender[]): void {
  const supported = useWebGLSupport();
  const key = genders.join(',');

  useEffect(() => {
    if (!supported || key === '') return;
    void import('./BodyGlucoseScene').catch(() => undefined);
    for (const gender of key.split(',') as Gender[]) {
      void getBodyGeometry(gender).catch(() => undefined);
    }
  }, [key, supported]);
}
