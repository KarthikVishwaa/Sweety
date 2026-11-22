import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from '@/components/layout/AppHeader';
import * as authApi from '@/features/auth/authApi';
import type { User } from '@/features/auth/types';

vi.mock('@/features/auth/authApi');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const USER: User = {
  id: '1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  role: 'patient',
  createdAt: '2026-01-01T00:00:00.000Z',
  dateOfBirth: null,
  gender: 'male',
};

async function openLogoutDialog() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppHeader heading="Hello" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  await userEvent.click(await screen.findByRole('button', { name: /Asha/ }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }));
  return screen.findByRole('dialog', { name: 'Log out' });
}

describe('Logout confirmation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authApi.getMe).mockResolvedValue(USER);
  });

  it('asks first and does not log out from the menu alone', async () => {
    const dialog = await openLogoutDialog();

    expect(dialog).toHaveTextContent('Are you sure you want to log out?');
    expect(authApi.logout).not.toHaveBeenCalled();
  });

  it('keeps the session when cancelled', async () => {
    await openLogoutDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(authApi.logout).not.toHaveBeenCalled();
  });

  it('logs out once confirmed', async () => {
    vi.mocked(authApi.logout).mockResolvedValue();
    await openLogoutDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(authApi.logout).toHaveBeenCalledTimes(1));
  });
});
