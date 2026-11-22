import { motion, useReducedMotion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { fadeIn, popIn } from '@/lib/motion';
import { StepHeading } from './StepHeading';

export function WelcomeStep({ firstName }: { firstName: string }) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-5"
      variants={reducedMotion ? fadeIn : popIn}
      initial="hidden"
      animate="visible"
    >
      <StepHeading
        focusOnMount
        description="Your account is ready. Log your first reading whenever you like, and Sweety will keep track of the rest."
      >
        Welcome to Sweety, {firstName}!
      </StepHeading>
      <PrimaryButton size="lg" className="w-full" onClick={() => navigate('/')}>
        Go to my dashboard
      </PrimaryButton>
    </motion.div>
  );
}
