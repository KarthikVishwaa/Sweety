import { useAnimationControls, useReducedMotion } from 'motion/react';
import { useCallback } from 'react';

export function useShakeOnError() {
  const controls = useAnimationControls();
  const reducedMotion = useReducedMotion();

  const shake = useCallback(() => {
    if (!reducedMotion) void controls.start('shake');
  }, [controls, reducedMotion]);

  return { controls, shake };
}
