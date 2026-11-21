import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { AuthField } from './AuthField';

type PasswordFieldProps = Omit<ComponentProps<typeof AuthField>, 'type' | 'endAdornment'>;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <AuthField
      {...props}
      type={visible ? 'text' : 'password'}
      endAdornment={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      }
    />
  );
}
