import { AppHeader } from '@/components/layout/AppHeader';
import { useMe } from '@/features/auth/useAuth';
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
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <AppHeader heading={`Hello, ${user?.name}`} />
      <main className="space-y-8">
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
      <ReadingDialogs dialogs={dialogs} defaultDate={date} />
    </div>
  );
}
