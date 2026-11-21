import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReadingsError } from '@/features/readings/components/ReadingsError';
import { cn } from '@/lib/utils';
import { isReportType, REPORT_LABELS, REPORT_TYPES } from '../reports.constants';
import { useReport } from '../useReport';
import { useReportType } from '../useReportType';
import { ReportBody } from './ReportBody';
import { ReportSkeleton } from './ReportSkeleton';

interface ReportsSectionProps {
  date: string;
  onAddReading: () => void;
}

export function ReportsSection({ date, onAddReading }: ReportsSectionProps) {
  const [type, setType] = useReportType();
  const {
    data: report,
    isPending,
    isError,
    error,
    refetch,
    isPlaceholderData,
  } = useReport(type, date);

  return (
    <section className="space-y-4" aria-labelledby="reports-heading">
      <h2 id="reports-heading" className="text-xl font-semibold">
        Reports
      </h2>
      <Tabs value={type} onValueChange={(value) => isReportType(value) && setType(value)}>
        <TabsList>
          {REPORT_TYPES.map((reportType) => (
            <TabsTrigger key={reportType} value={reportType}>
              {REPORT_LABELS[reportType]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={type} className="pt-2">
          {isPending && <ReportSkeleton />}
          {isError && <ReadingsError message={error.message} onRetry={() => void refetch()} />}
          {report && (
            <div
              className={cn(isPlaceholderData && 'opacity-60 transition-opacity')}
              aria-busy={isPlaceholderData}
            >
              <ReportBody report={report} onAddReading={onAddReading} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
