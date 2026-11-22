import { useEffect } from 'react';
import type { Gender } from './bodyProportions';
import { useWebGLSupport } from './useWebGLSupport';

// Fetches the 3D code and the given figures in the background, so the next screen shows them at once.
export function usePreloadBody(genders: readonly Gender[]): void {
  const supported = useWebGLSupport();
  const key = genders.join(',');

  useEffect(() => {
    if (!supported || key === '') return;
    // Both are dynamic imports, so pages that only preload never pull three.js into their own chunk.
    void import('./BodyGlucoseScene').catch(() => undefined);
    void import('./bodyGeometry')
      .then(({ getBodyGeometry }) =>
        Promise.all((key.split(',') as Gender[]).map((gender) => getBodyGeometry(gender))),
      )
      .catch(() => undefined);
  }, [key, supported]);
}
