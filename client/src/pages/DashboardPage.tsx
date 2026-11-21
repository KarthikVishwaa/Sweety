import { LogOut } from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '@/components/layout/BrandMark';
import { Button } from '@/components/ui/button';
import { useLogout, useMe } from '@/features/auth/useAuth';
import { DateNavigator } from '@/features/readings/components/DateNavigator';
import { DeleteReadingDialog } from '@/features/readings/components/DeleteReadingDialog';
import { ReadingDialog } from '@/features/readings/components/ReadingDialog';
import type { ReadingEditor } from '@/features/readings/components/readingEditor';
import { ReadingsSection } from '@/features/readings/components/ReadingsSection';
import { useSelectedDate } from '@/features/readings/useSelectedDate';
import type { Reading } from '@/features/readings/types';
import { ReportsSection } from '@/features/reports/components/ReportsSection';

export function DashboardPage() {
  const { data: user } = useMe();
  const logout = useLogout();
  const [date, setDate] = useSelectedDate();
  const [editor, setEditor] = useState<ReadingEditor>();
  const [deleting, setDeleting] = useState<Reading>();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <BrandMark className="text-lg text-teal-700" />
          <h1 className="text-2xl font-semibold">Hello, {user?.name}</h1>
        </div>
        <Button variant="outline" onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut aria-hidden="true" />
          Logout
        </Button>
      </header>
      <main className="space-y-8">
        <div className="space-y-6">
          <DateNavigator date={date} onChange={setDate} />
          <ReadingsSection
            date={date}
            onAdd={(slot) => setEditor({ mode: 'add', slot })}
            onEdit={(reading) => setEditor({ mode: 'edit', reading })}
            onDelete={setDeleting}
          />
        </div>
        <ReportsSection date={date} onAddReading={() => setEditor({ mode: 'add' })} />
      </main>
      <ReadingDialog editor={editor} defaultDate={date} onClose={() => setEditor(undefined)} />
      <DeleteReadingDialog reading={deleting} onClose={() => setDeleting(undefined)} />
    </div>
  );
}
