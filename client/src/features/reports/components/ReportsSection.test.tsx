import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as reportsApi from '../reportsApi';
import type { Report, ReportType } from '../types';
import { ReportsSection } from './ReportsSection';

vi.mock('../reportsApi');

const LAZY_CHART_TIMEOUT_MS = 5000;
const DATE = '2026-10-15';

const daily: Report = {
  type: 'daily',
  from: DATE,
  to: DATE,
  count: 3,
  highest: 182,
  lowest: 95,
  average: 138.5,
  readings: [
    { id: '1', slot: 'morning_fasting', slotLabel: 'Morning (fasting)', value: 95, date: DATE },
    { id: '2', slot: 'after_lunch', slotLabel: 'After lunch', value: 182, date: DATE },
    { id: '3', slot: 'after_dinner', slotLabel: 'After dinner', value: 138, date: DATE },
  ],
};

const days = [
  { date: '2026-10-01', average: 120, lowest: 100, highest: 140, count: 2 },
  { date: '2026-10-10', average: 160, lowest: 160, highest: 160, count: 1 },
];

const reports: Record<ReportType, Report> = {
  daily,
  mtd: {
    type: 'mtd',
    from: '2026-10-01',
    to: DATE,
    count: 3,
    highest: 160,
    lowest: 100,
    average: 133.3,
    days,
  },
  monthly: {
    type: 'monthly',
    from: '2026-09-01',
    to: '2026-09-30',
    count: 0,
    highest: null,
    lowest: null,
    average: null,
    days: [],
  },
};

function renderSection(onAddReading = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/?date=${DATE}`]}>
        <ReportsSection date={DATE} onAddReading={onAddReading} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onAddReading;
}

function statCard(label: string): HTMLElement {
  return screen.getByText(label).closest('[data-slot="card"]') as HTMLElement;
}

describe('ReportsSection', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(reportsApi.getReport).mockImplementation(async (type) => reports[type]);
  });

  it('shows the four values and band badges for a normal response', async () => {
    renderSection();

    expect(await screen.findByText('15 Oct 2026')).toBeInTheDocument();
    const highest = statCard('Highest');
    expect(within(highest).getByText('182')).toBeInTheDocument();
    expect(within(highest).getByText('High')).toBeInTheDocument();

    const lowest = statCard('Lowest');
    expect(within(lowest).getByText('95')).toBeInTheDocument();
    expect(within(lowest).getByText('In range')).toBeInTheDocument();

    const average = statCard('Average');
    expect(within(average).getByText('138.5')).toBeInTheDocument();
    expect(within(average).getByText('In range')).toBeInTheDocument();

    expect(within(statCard('Readings')).getByText('3')).toBeInTheDocument();
  });

  it('lists the day’s readings with their slot labels on the daily tab', async () => {
    renderSection();

    const list = await screen.findByRole('list', { name: 'Readings for the day' });

    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    expect(within(list).getByText('After lunch')).toBeInTheDocument();
  });

  it('switches tabs and changes the visible range text', async () => {
    renderSection();
    expect(await screen.findByText('15 Oct 2026')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Month to date' }));
    expect(await screen.findByText('1 Oct – 15 Oct 2026')).toBeInTheDocument();
    expect(
      await screen.findByRole(
        'img',
        { name: 'Daily average glucose, 1 Oct to 15 Oct, 2 days with readings' },
        { timeout: LAZY_CHART_TIMEOUT_MS },
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Previous month' }));
    expect(await screen.findByText('1 Sep – 30 Sep 2026')).toBeInTheDocument();
  });

  it('shows the empty state when there are no readings, without stat cards', async () => {
    renderSection();
    await userEvent.click(await screen.findByRole('tab', { name: 'Previous month' }));

    expect(await screen.findByText('No readings in this period yet')).toBeInTheDocument();
    expect(screen.queryByText('Highest')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a reading' })).not.toBeInTheDocument();
  });

  it('offers to add a reading from the daily empty state', async () => {
    vi.mocked(reportsApi.getReport).mockResolvedValue({
      ...reports.monthly,
      type: 'daily',
      from: DATE,
      to: DATE,
      readings: [],
    });
    const onAddReading = renderSection();

    await userEvent.click(await screen.findByRole('button', { name: 'Add a reading' }));

    expect(onAddReading).toHaveBeenCalledOnce();
  });

  it('shows an error with a retry button when the report fails to load', async () => {
    vi.mocked(reportsApi.getReport).mockRejectedValueOnce(new Error('Server is down'));
    renderSection();

    expect(await screen.findByText('Server is down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('15 Oct 2026')).toBeInTheDocument();
  });
});
