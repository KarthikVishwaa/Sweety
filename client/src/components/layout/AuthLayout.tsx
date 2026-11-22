import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { AuthStage, type StageContent } from '@/components/layout/AuthStage';
import { Logo } from '@/components/layout/Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fadeUp } from '@/lib/motion';

// From lg up the forms grow with the screen: taller fields and buttons, and body text one step larger.
const LARGE_FORM =
  'lg:p-6 lg:[&_button]:h-11 lg:[&_button]:text-base lg:[&_input]:h-11 lg:[&_input]:text-base lg:[&_label]:text-base lg:[&_p]:text-base';

interface AuthLayoutProps {
  stage: StageContent;
  tagline: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
  children: ReactNode;
}

export function AuthLayout({
  stage,
  tagline,
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-dvh bg-gradient-to-br from-teal-50 via-white to-teal-50 lg:grid-cols-2 dark:bg-background dark:bg-none">
      <aside className="flex flex-col items-center justify-center gap-3 px-6 pt-6 lg:gap-6 lg:px-12 lg:py-8">
        <Logo className="h-9 lg:h-12" />
        <AuthStage content={stage} />
        <p className="hidden max-w-xs text-center text-2xl font-semibold text-teal-900 lg:block lg:text-3xl">
          {tagline}
        </p>
      </aside>
      <main className="flex items-start justify-center px-4 py-6 lg:items-center lg:p-12">
        <motion.div
          className="w-full max-w-sm space-y-4 lg:max-w-2xl 3xl:max-w-3xl"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <Card>
            {title && (
              <CardHeader>
                <CardTitle className="text-xl">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
              </CardHeader>
            )}
            <CardContent className={LARGE_FORM}>{children}</CardContent>
          </Card>
          {footer && <p className="text-center text-sm text-muted-foreground">{footer}</p>}
        </motion.div>
      </main>
    </div>
  );
}
