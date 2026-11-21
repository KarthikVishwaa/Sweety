import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { BrandMark } from '@/components/layout/BrandMark';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { fadeUp } from '@/lib/motion';

interface AuthLayoutProps {
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthLayout({ title, description, footer, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-gradient-to-br from-teal-600 to-teal-800 p-12 text-white lg:flex">
        <BrandMark />
        <p className="max-w-sm text-3xl leading-snug font-semibold">
          Know your numbers. Stay in range.
        </p>
      </aside>
      <main className="flex items-center justify-center bg-muted/30 p-6">
        <motion.div
          className="w-full max-w-sm space-y-6"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          <BrandMark className="justify-center text-teal-700 lg:hidden" />
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>
          <p className="text-center text-sm text-muted-foreground">{footer}</p>
        </motion.div>
      </main>
    </div>
  );
}
