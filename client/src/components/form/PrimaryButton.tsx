import { motion } from 'motion/react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { TAP_SCALE } from '@/lib/motion';

const MotionButton = motion.create(Button);

export function PrimaryButton(props: ComponentProps<typeof Button>) {
  return <MotionButton whileTap={TAP_SCALE} {...(props as ComponentProps<typeof MotionButton>)} />;
}
