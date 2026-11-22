import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/features/auth/authApi';
import type { User } from '@/features/auth/types';
import * as readingsApi from '@/features/readings/readingsApi';
import type { Reading, ReadingSlot } from '@/features/readings/types';
import * as genderApi from './genderApi';
import { BodyPanel } from './BodyPanel';

vi.mock('@/features/auth/authApi');
vi.mock('@/features/readings/readingsApi');
vi.mock('./genderApi');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('./BodyGlucoseGauge', () => ({
  BodyGlucoseGauge: ({ model, value }: { model: string; value: number | null }) => (
    <div data-testid="gauge">{`${model}:${value ?? 'empty'}`}</div>
  ),
}));

const USER: User = {
  id: '1',
  name: 'Asha',
  email: 'asha@example.com',
  role: 'patient',
  dateOfBirth: null,
  gender: 'male',
};

function reading(slot: ReadingSlot, value: number): Reading {
  return {
    id: slot,
    date: '2026-11-21',
    slot,
    slotLabel: slot,
    value,
    createdAt: '',
    updatedAt: '',
  };
}

function renderPanel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BodyPanel date="2026-11-21" />
    </QueryClientProvider>,
  );
  return queryClient;
}

describe('BodyPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authApi.getMe).mockResolvedValue(USER);
    vi.mocked(readingsApi.listReadings).mockResolvedValue([]);
  });

  it('follows the latest reading of the day and says so in text', async () => {
    vi.mocked(readingsApi.listReadings).mockResolvedValue([
      reading('morning_fasting', 90),
      reading('after_lunch', 182),
      reading('after_breakfast', 120),
    ]);
    renderPanel();

    expect(await screen.findByText('After lunch, 182 mg/dl, High')).toBeInTheDocument();
    expect(screen.getByTestId('gauge')).toHaveTextContent('male:182');
  });

  it('shows an empty body and an invitation when the day has no readings', async () => {
    renderPanel();

    expect(await screen.findByText('Add your first reading for this day')).toBeInTheDocument();
    expect(screen.getByTestId('gauge')).toHaveTextContent('male:empty');
  });

  it('updates when the readings change', async () => {
    vi.mocked(readingsApi.listReadings).mockResolvedValue([reading('morning_fasting', 90)]);
    const queryClient = renderPanel();
    expect(await screen.findByText('Morning (fasting), 90 mg/dl, In range')).toBeInTheDocument();

    vi.mocked(readingsApi.listReadings).mockResolvedValue([
      reading('morning_fasting', 90),
      reading('after_dinner', 65),
    ]);
    await queryClient.invalidateQueries({ queryKey: ['readings'] });

    expect(await screen.findByText('After dinner, 65 mg/dl, Low')).toBeInTheDocument();
    expect(screen.getByTestId('gauge')).toHaveTextContent('male:65');
  });

  it('switches the figure at once and saves the choice', async () => {
    vi.mocked(genderApi.updateGender).mockResolvedValue({ ...USER, gender: 'female' });
    renderPanel();
    await screen.findByText('Add your first reading for this day');

    await userEvent.click(screen.getByRole('radio', { name: 'Female' }));

    expect(screen.getByTestId('gauge')).toHaveTextContent('female:empty');
    expect(genderApi.updateGender).toHaveBeenCalledWith('female');
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked();
  });

  it('can switch to other', async () => {
    vi.mocked(genderApi.updateGender).mockResolvedValue({ ...USER, gender: 'other' });
    renderPanel();
    await screen.findByText('Add your first reading for this day');

    await userEvent.click(screen.getByRole('radio', { name: 'Other' }));

    expect(screen.getByTestId('gauge')).toHaveTextContent('other:empty');
    expect(genderApi.updateGender).toHaveBeenCalledWith('other');
  });

  it('puts the figure back and tells the person when saving fails', async () => {
    vi.mocked(genderApi.updateGender).mockRejectedValue(new Error('Network'));
    renderPanel();
    await screen.findByText('Add your first reading for this day');

    await userEvent.click(screen.getByRole('radio', { name: 'Female' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId('gauge')).toHaveTextContent('male:empty'));
    expect(screen.getByRole('radio', { name: 'Male' })).toBeChecked();
  });
});
