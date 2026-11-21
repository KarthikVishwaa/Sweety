import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '@/components/form/PrimaryButton';
import { StepHeading } from './StepHeading';

export function WelcomeStep({ firstName }: { firstName: string }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <StepHeading
        focusOnMount
        description="Your account is ready. Log your first reading whenever you like, and Sweety will keep track of the rest."
      >
        Welcome to Sweety, {firstName}!
      </StepHeading>
      <PrimaryButton size="lg" className="w-full" onClick={() => navigate('/')}>
        Go to my dashboard
      </PrimaryButton>
    </div>
  );
}
