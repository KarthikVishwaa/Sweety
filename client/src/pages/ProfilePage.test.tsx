import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/features/auth/authApi';
import type { User } from '@/features/auth/types';
import * as insightsApi from '@/features/insights/insightsApi';
import type { Insights } from '@/features/insights/types';
import * as profileApi from '@/features/profile/profileApi';
import { ProfilePage } from './ProfilePage';

vi.mock('@/features/auth/authApi');
vi.mock('@/features/insights/insightsApi');
vi.mock('@/features/profile/profileApi');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// The canvas cannot run here: the figure is replaced by something that shows what it was given.
vi.mock('@/features/body/BodyGlucoseGauge', () => ({
  BodyGlucoseGauge: ({ model, value }: { model: string; value: number | null }) => (
    <div data-testid="figure" data-model={model} data-value={String(value)} />
  ),
}));

const USER: User = {
  id: '1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  role: 'patient',
  dateOfBirth: '1990-01-01',
  gender: 'male',
  createdAt: '2026-01-01T00:00:00.000Z',
};

// The hand-checkable month: day 1 has 100 and 150, day 2 has 200, day 4 has 65.
function insights(overrides: Partial<Insights> = {}): Insights {
  return {
    month: '2026-11',
    range: { from: '2026-11-01', to: '2026-11-22' },
    count: 4,
    average: 128.8,
    highest: 200,
    lowest: 65,
    bands: {
      counts: { low: 1, inRange: 2, high: 1 },
      percentages: { low: 25, inRange: 50, high: 25 },
    },
    bySlot: [
      { slot: 'morning_fasting', slotLabel: 'Morning (fasting)', average: 121.7, count: 3 },
      { slot: 'after_breakfast', slotLabel: 'After breakfast', average: 150, count: 1 },
      { slot: 'after_lunch', slotLabel: 'After lunch', average: null, count: 0 },
      { slot: 'after_dinner', slotLabel: 'After dinner', average: null, count: 0 },
    ],
    highestSlot: 'after_breakfast',
    days: [
      { date: '2026-11-01', average: 125, lowest: 100, highest: 150, count: 2 },
      { date: '2026-11-02', average: 200, lowest: 200, highest: 200, count: 1 },
      { date: '2026-11-04', average: 65, lowest: 65, highest: 65, count: 1 },
    ],
    consistency: {
      daysLogged: 3,
      daysInPeriod: 22,
      currentStreak: 0,
      longestStreak: 2,
      completionPercent: 5,
    },
    highlights: {
      highest: {
        value: 200,
        date: '2026-11-02',
        slot: 'morning_fasting',
        slotLabel: 'Morning (fasting)',
      },
      lowest: {
        value: 65,
        date: '2026-11-04',
        slot: 'morning_fasting',
        slotLabel: 'Morning (fasting)',
      },
    },
    comparison: {
      previousAverage: 135,
      previousInRangePercent: 80,
      averageChange: -6.2,
      inRangeChange: -30,
    },
    recent: [
      {
        id: 'r1',
        date: '2026-11-04',
        slot: 'morning_fasting',
        slotLabel: 'Morning (fasting)',
        value: 65,
      },
    ],
    lifetime: { totalReadings: 12, firstReadingDate: '2026-09-03' },
    ...overrides,
  };
}

function Location() {
  const { pathname, search } = useLocation();
  return <p data-testid="location">{pathname + search}</p>;
}

function renderPage(path = '/profile') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<p>Dashboard page</p>} />
        </Routes>
        <Location />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  // Today is 22 November 2026, so the current month is 2026-11.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-22T06:00:00Z'));
  vi.mocked(authApi.getMe).mockResolvedValue(USER);
  vi.mocked(insightsApi.getInsights).mockImplementation((month) =>
    Promise.resolve(insights({ month })),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the personal card', () => {
  it('shows the details, with the age worked out from the date of birth', async () => {
    renderPage();

    const card = await screen.findByRole('region', { name: 'Personal details' });
    expect(within(card).getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    expect(within(card).getByText('asha@example.com')).toBeInTheDocument();
    expect(within(card).getByText('36 years (born Mon, 1 Jan 1990)')).toBeInTheDocument();
    expect(within(card).getByText('Male')).toBeInTheDocument();
    expect(within(card).getByText('Thu, 1 Jan 2026')).toBeInTheDocument();
    await waitFor(() => expect(within(card).getByText('12')).toBeInTheDocument());
    expect(within(card).getByText('Thu, 3 Sep 2026')).toBeInTheDocument();
  });

  it('shows the initials in the avatar', async () => {
    renderPage();

    expect(await screen.findByText('AR')).toBeInTheDocument();
  });
});

describe('the month picker', () => {
  it('starts on the current month and cannot go past it', async () => {
    renderPage();

    expect(await screen.findByText('November 2026')).toBeInTheDocument();
    expect(insightsApi.getInsights).toHaveBeenCalledWith('2026-11');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeDisabled();
  });

  it('asks for the previous month and keeps the month in the URL', async () => {
    renderPage();
    await screen.findByText('November 2026');

    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));

    expect(await screen.findByText('October 2026')).toBeInTheDocument();
    expect(insightsApi.getInsights).toHaveBeenCalledWith('2026-10');
    expect(screen.getByTestId('location')).toHaveTextContent('/profile?month=2026-10');
    expect(screen.getByRole('button', { name: 'Next month' })).toBeEnabled();
  });

  it('opens on the month in the URL', async () => {
    renderPage('/profile?month=2026-08');

    expect(await screen.findByText('August 2026')).toBeInTheDocument();
    expect(insightsApi.getInsights).toHaveBeenCalledWith('2026-08');
  });

  it.each(['garbage', '2026-13', '2027-01'])(
    'falls back to the current month for %s',
    async (value) => {
      renderPage(`/profile?month=${value}`);

      expect(await screen.findByText('November 2026')).toBeInTheDocument();
      expect(insightsApi.getInsights).toHaveBeenCalledWith('2026-11');
      expect(insightsApi.getInsights).not.toHaveBeenCalledWith(value);
    },
  );
});

describe('the insights', () => {
  it('shows the summary figures', async () => {
    renderPage();

    await screen.findByRole('region', { name: 'Consistency' });
    for (const label of ['Average', 'In range', 'Readings', 'Days logged']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('128.8')).toBeInTheDocument();
  });

  it('writes time in range out as text, with labels, percentages and counts', async () => {
    renderPage();

    const block = await screen.findByRole('region', { name: 'Time in range' });
    const items = within(block).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Low25%1 reading',
      'In range50%2 readings',
      'High25%1 reading',
    ]);
  });

  it('describes the comparison in plain words', async () => {
    renderPage();

    const block = await screen.findByRole('region', { name: 'Compared with last month' });
    expect(
      within(block).getByText('Average is 6.2 mg/dl lower than last month.'),
    ).toBeInTheDocument();
    expect(
      within(block).getByText('Time in range is 30 percentage points lower than last month.'),
    ).toBeInTheDocument();
  });

  it('marks the highest slot in text', async () => {
    renderPage();

    expect(
      await screen.findByText('Highest average: After breakfast, 150 mg/dl.'),
    ).toBeInTheDocument();
  });

  it('gives every chart a text equivalent', async () => {
    renderPage();

    const slots = await screen.findByRole('table', { name: 'Average glucose by meal slot' });
    expect(within(slots).getByText('After lunch')).toBeInTheDocument();
    expect(within(slots).getAllByText('No readings')).toHaveLength(2);
    const daily = screen.getByRole('table', { name: 'Daily average glucose' });
    expect(within(daily).getAllByRole('row')).toHaveLength(4);
    expect(within(daily).getByText('Mon, 2 Nov 2026')).toBeInTheDocument();
  });

  it('shows the consistency figures, the highlights and the recent readings', async () => {
    renderPage();

    const consistency = await screen.findByRole('region', { name: 'Consistency' });
    expect(within(consistency).getByText('3 of 22')).toBeInTheDocument();
    expect(within(consistency).getByText('2 days')).toBeInTheDocument();
    expect(within(consistency).getByText('5%')).toBeInTheDocument();
    const highlights = screen.getByRole('region', { name: 'Highlights' });
    expect(within(highlights).getByText('200 mg/dl')).toBeInTheDocument();
    expect(within(highlights).getByText('65 mg/dl')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Recent readings' })).toHaveTextContent('65 mg/dl');
  });

  it('adds short lines that only restate the numbers, and a not-medical-advice note', async () => {
    renderPage();

    const lines = await screen.findByRole('region', { name: 'What the numbers show' });
    expect(within(lines).getAllByRole('listitem').length).toBeLessThanOrEqual(3);
    expect(lines).toHaveTextContent('Your average was 128.8 mg/dl, which is in range.');
    expect(screen.getByText(/Not medical advice/)).toBeInTheDocument();
  });
});

describe('the figure', () => {
  it('is filled to the average of the month, in the account’s gender', async () => {
    renderPage();

    await screen.findByText('Average this month: 128.8 mg/dl, In range');
    expect(screen.getByTestId('figure')).toHaveAttribute('data-value', '128.8');
    expect(screen.getByTestId('figure')).toHaveAttribute('data-model', 'male');
  });

  it('follows the month that is chosen', async () => {
    vi.mocked(insightsApi.getInsights).mockImplementation((month) =>
      Promise.resolve(
        month === '2026-10' ? insights({ month, average: 190.5 }) : insights({ month }),
      ),
    );
    renderPage();
    await screen.findByText('Average this month: 128.8 mg/dl, In range');

    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }));

    expect(
      await screen.findByText('Average in October 2026: 190.5 mg/dl, High'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('figure')).toHaveAttribute('data-value', '190.5');
  });

  it('is the neutral figure until a gender is chosen', async () => {
    vi.mocked(authApi.getMe).mockResolvedValue({ ...USER, gender: null });
    renderPage();

    await screen.findByText('Average this month: 128.8 mg/dl, In range');
    expect(screen.getByTestId('figure')).toHaveAttribute('data-model', 'other');
  });
});

describe('a month without readings', () => {
  beforeEach(() => {
    vi.mocked(insightsApi.getInsights).mockImplementation((month) =>
      Promise.resolve(
        insights({
          month,
          count: 0,
          average: null,
          highest: null,
          lowest: null,
          days: [],
          bands: {
            counts: { low: 0, inRange: 0, high: 0 },
            percentages: { low: 0, inRange: 0, high: 0 },
          },
        }),
      ),
    );
  });

  it('shows a friendly empty state with a way back to the dashboard', async () => {
    renderPage('/profile?month=2026-10');

    const link = await screen.findByRole('link', { name: 'Go to the dashboard' });
    expect(screen.getAllByText('No readings in October 2026').length).toBeGreaterThan(0);
    await userEvent.click(link);
    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });

  it('shows the empty figure and no charts', async () => {
    renderPage();

    await screen.findByRole('link', { name: 'Go to the dashboard' });
    expect(screen.getByText('No readings in November 2026')).toBeInTheDocument();
    expect(screen.getByText('No readings this month')).toBeInTheDocument();
    expect(screen.getByTestId('figure')).toHaveAttribute('data-value', 'null');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

describe('loading and errors', () => {
  it('shows a skeleton while the month loads', async () => {
    vi.mocked(insightsApi.getInsights).mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect(await screen.findByLabelText('Loading insights')).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows the error with a retry', async () => {
    vi.mocked(insightsApi.getInsights).mockRejectedValue(new Error('Could not load.'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load.');
    vi.mocked(insightsApi.getInsights).mockImplementation((month) =>
      Promise.resolve(insights({ month })),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('region', { name: 'Consistency' })).toBeInTheDocument();
  });
});

describe('editing the profile', () => {
  async function openEditor() {
    renderPage();
    await screen.findByRole('region', { name: 'Consistency' });
    await userEvent.click(screen.getByRole('button', { name: 'Edit profile' }));
    return screen.findByRole('dialog', { name: 'Edit profile' });
  }

  it('starts with the current values and shows the live age', async () => {
    const dialog = await openEditor();

    expect(within(dialog).getByLabelText('Name')).toHaveValue('Asha Rao');
    expect(within(dialog).getByLabelText('Date of birth')).toHaveValue('1990-01-01');
    expect(within(dialog).getByRole('radio', { name: 'Male' })).toBeChecked();
    expect(within(dialog).getByText('You are 36 years and 10 months old')).toBeInTheDocument();
  });

  it('uses the same validation messages as signing up, and sends nothing while invalid', async () => {
    const dialog = await openEditor();
    await userEvent.clear(within(dialog).getByLabelText('Name'));
    await userEvent.type(within(dialog).getByLabelText('Name'), 'A');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await within(dialog).findByText('Name must be at least 2 characters'),
    ).toBeInTheDocument();
    expect(profileApi.updateProfile).not.toHaveBeenCalled();
  });

  it('shows the change at once and saves only what changed', async () => {
    vi.mocked(profileApi.updateProfile).mockReturnValue(new Promise(() => undefined));
    const dialog = await openEditor();
    await userEvent.clear(within(dialog).getByLabelText('Name'));
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Asha K');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(profileApi.updateProfile).toHaveBeenCalledWith({ name: 'Asha K' });
    expect(
      await within(screen.getByRole('region', { name: 'Personal details' })).findByText('Asha K'),
    ).toBeInTheDocument();
  });

  it('puts the change back and says so when the server refuses it', async () => {
    vi.mocked(profileApi.updateProfile).mockRejectedValue(new Error('no'));
    const dialog = await openEditor();
    await userEvent.clear(within(dialog).getByLabelText('Name'));
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Asha K');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    const card = screen.getByRole('region', { name: 'Personal details' });
    await waitFor(() =>
      expect(within(card).getByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument(),
    );
  });

  it('changes the gender from the same dialog, and the figure follows', async () => {
    vi.mocked(profileApi.updateProfile).mockResolvedValue({ ...USER, gender: 'female' });
    const dialog = await openEditor();

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Female' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(profileApi.updateProfile).toHaveBeenCalledWith({ gender: 'female' });
    await waitFor(() =>
      expect(screen.getByTestId('figure')).toHaveAttribute('data-model', 'female'),
    );
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Profile updated'));
  });

  it('sends nothing when nothing changed', async () => {
    const dialog = await openEditor();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(profileApi.updateProfile).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
