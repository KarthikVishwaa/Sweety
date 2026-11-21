import { useAnimationControls } from 'motion/react';
import { useCallback } from 'react';

export function useShakeOnError() {
  const controls = useAnimationControls();
  const shake = useCallback(() => void controls.start('shake'), [controls]);

  return { controls, shake };
}
