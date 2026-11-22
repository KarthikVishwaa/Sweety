import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/features/auth/authApi';
import type { User } from '@/features/auth/types';
import { ChooseFigureDialog } from './ChooseFigureDialog';
import * as genderApi from './genderApi';

vi.mock('@/features/auth/authApi');
vi.mock('./genderApi');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

let nextId = 0;
const userWithout = (gender: User['gender'] = null): User => ({
  // A fresh id per test: a dismissed prompt is remembered per account for the page session.
  id: `user-${++nextId}`,
  name: 'Old Account',
  email: 'old@example.com',
  role: 'patient',
  dateOfBirth: null,
  gender,
});

function renderPrompt() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <ChooseFigureDialog />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('Choose a figure prompt', () => {
  beforeEach(() => vi.resetAllMocks());

  it('asks an account without a gender to choose, with nothing selected', async () => {
    vi.mocked(authApi.getMe).mockResolvedValue(userWithout());
    renderPrompt();

    expect(await screen.findByRole('dialog', { name: 'Choose a figure' })).toBeInTheDocument();
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('saves the choice and does not come back', async () => {
    const user = userWithout();
    vi.mocked(authApi.getMe).mockResolvedValue(user);
    vi.mocked(genderApi.updateGender).mockResolvedValue({ ...user, gender: 'female' });
    renderPrompt();
    await screen.findByRole('dialog', { name: 'Choose a figure' });

    await userEvent.click(screen.getByRole('radio', { name: 'Female' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(genderApi.updateGender).toHaveBeenCalledWith('female');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('can be dismissed, and stays dismissed for the session', async () => {
    const user = userWithout();
    vi.mocked(authApi.getMe).mockResolvedValue(user);
    const { unmount } = renderPrompt();
    await screen.findByRole('dialog', { name: 'Choose a figure' });

    await userEvent.click(screen.getByRole('button', { name: 'Not now' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    unmount();
    renderPrompt();
    await waitFor(() => expect(authApi.getMe).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(genderApi.updateGender).not.toHaveBeenCalled();
  });

  it('never appears once a gender is saved', async () => {
    vi.mocked(authApi.getMe).mockResolvedValue(userWithout('other'));
    renderPrompt();

    await waitFor(() => expect(authApi.getMe).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
