import { AppHeader } from '@/components/layout/AppHeader';
import { AppShell } from '@/components/layout/AppShell';
import { useMe } from '@/features/auth/useAuth';
import { BodyPanel } from '@/features/body/BodyPanel';
import { ChooseFigureDialog } from '@/features/body/ChooseFigureDialog';
import { DateNavigator } from '@/features/readings/components/DateNavigator';
import { ReadingDialogs } from '@/features/readings/components/ReadingDialogs';
import { ReadingsSection } from '@/features/readings/components/ReadingsSection';
import { useReadingDialogs } from '@/features/readings/useReadingDialogs';
import { useSelectedDate } from '@/features/readings/useSelectedDate';
import { ReportsSection } from '@/features/reports/components/ReportsSection';

export function DashboardPage() {
  const { data: user } = useMe();
  const [date, setDate] = useSelectedDate();
  const dialogs = useReadingDialogs();

  return (
    <AppShell>
      <AppHeader heading={`Hello, ${user?.name}`} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <BodyPanel date={date} />
        </aside>
        <main className="min-w-0 space-y-8">
          <div className="space-y-6">
            <DateNavigator date={date} onChange={setDate} />
            <ReadingsSection
              date={date}
              onAdd={dialogs.openAdd}
              onEdit={dialogs.openEdit}
              onDelete={dialogs.openDelete}
            />
          </div>
          <ReportsSection date={date} onAddReading={() => dialogs.openAdd()} />
        </main>
      </div>
      <ReadingDialogs dialogs={dialogs} defaultDate={date} />
      <ChooseFigureDialog />
    </AppShell>
  );
}
