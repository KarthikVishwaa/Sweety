import { useState } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { AppShell } from '@/components/layout/AppShell';
import { useMe } from '@/features/auth/useAuth';
import { InsightsSection } from '@/features/insights/components/InsightsSection';
import { formatMonth } from '@/features/insights/month';
import { useInsights } from '@/features/insights/useInsights';
import { useMonthParam } from '@/features/insights/useMonthParam';
import { EditProfileDialog } from '@/features/profile/EditProfileDialog';
import { PersonalCard } from '@/features/profile/PersonalCard';
import { ProfileFigure } from '@/features/profile/ProfileFigure';

export function ProfilePage() {
  const { data: user } = useMe();
  const { month, setMonth, isCurrent } = useMonthParam();
  const { data: insights, isPending } = useInsights(month);
  const [editing, setEditing] = useState(false);
  if (!user) return null;

  return (
    <AppShell>
      <AppHeader heading="Profile" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <ProfileFigure
            gender={user.gender}
            average={insights?.average ?? null}
            pending={isPending}
            period={isCurrent ? 'this month' : `in ${formatMonth(month)}`}
          />
        </aside>
        <main className="min-w-0 space-y-6">
          <PersonalCard user={user} lifetime={insights?.lifetime} onEdit={() => setEditing(true)} />
          <InsightsSection month={month} isCurrent={isCurrent} onMonthChange={setMonth} />
        </main>
      </div>
      <EditProfileDialog open={editing} onOpenChange={setEditing} />
    </AppShell>
  );
}
