import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/features/auth/authApi';
import * as readingsApi from '@/features/readings/readingsApi';
import type { Reading, ReadingSlot, ReadingsPage } from '@/features/readings/types';
import { HistoryPage } from './HistoryPage';

vi.mock('@/features/auth/authApi');
vi.mock('@/features/readings/readingsApi');

const TOTAL = 45;
const SLOTS: ReadingSlot[] = ['morning_fasting', 'after_breakfast', 'after_lunch', 'after_dinner'];

function pageOf(page: number, limit: number, total = TOTAL): ReadingsPage {
  const start = (page - 1) * limit;
  const count = Math.max(0, Math.min(limit, total - start));
  const data: Reading[] = Array.from({ length: count }, (_, index) => ({
    id: `reading-${start + index}`,
    date: '2026-01-10',
    slot: SLOTS[(start + index) % 4] as ReadingSlot,
    slotLabel: 'Slot',
    value: 100 + start + index,
    createdAt: '',
    updatedAt: '',
  }));
  return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

function renderHistory(url = '/history') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <HistoryPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HistoryPage pagination', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: '1',
      name: 'Asha',
      email: 'asha@example.com',
      role: 'patient',
    });
    vi.mocked(readingsApi.listReadingsPage).mockImplementation(async ({ page, limit }) =>
      pageOf(page, limit),
    );
  });

  it('requests the first page by default and shows the visible range', async () => {
    renderHistory();

    expect(await screen.findByText('Showing 1–20 of 45 readings')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 3')).toHaveAttribute('aria-current', 'page');
    expect(readingsApi.listReadingsPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
  });

  it('moves forward and back, requesting the matching page each time', async () => {
    renderHistory();
    await screen.findByText('Showing 1–20 of 45 readings');

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 21–40 of 45 readings')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(readingsApi.listReadingsPage).toHaveBeenLastCalledWith({ page: 2, limit: 20 });

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Showing 41–45 of 45 readings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Previous' }));
    expect(await screen.findByText('Showing 21–40 of 45 readings')).toBeInTheDocument();
    expect(readingsApi.listReadingsPage).toHaveBeenLastCalledWith({ page: 2, limit: 20 });
  });

  it('reads page and limit from the URL', async () => {
    renderHistory('/history?page=2&limit=10');

    expect(await screen.findByText('Showing 11–20 of 45 readings')).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();
    expect(readingsApi.listReadingsPage).toHaveBeenCalledWith({ page: 2, limit: 10 });
  });

  it('falls back to the defaults for invalid URL values', async () => {
    renderHistory('/history?page=abc&limit=7');

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    expect(readingsApi.listReadingsPage).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('moves back to the last page when the requested page no longer exists', async () => {
    renderHistory('/history?page=9');

    await waitFor(() =>
      expect(readingsApi.listReadingsPage).toHaveBeenCalledWith({ page: 3, limit: 20 }),
    );
    expect(await screen.findByText('Page 3 of 3')).toBeInTheDocument();
  });

  it('shows a friendly empty state for a brand-new user', async () => {
    vi.mocked(readingsApi.listReadingsPage).mockResolvedValue(pageOf(1, 20, 0));
    renderHistory();

    expect(await screen.findByText('No readings yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the dashboard' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
  });

  it('shows an error with a retry button when loading fails', async () => {
    vi.mocked(readingsApi.listReadingsPage).mockRejectedValueOnce(new Error('Server is down'));
    renderHistory();

    expect(await screen.findByText('Server is down')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
  });
});
