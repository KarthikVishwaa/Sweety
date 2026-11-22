import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from '@/components/layout/AppHeader';
import * as authApi from '@/features/auth/authApi';
import type { User } from '@/features/auth/types';
import * as genderApi from '@/features/body/genderApi';

vi.mock('@/features/auth/authApi');
vi.mock('@/features/body/genderApi');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const USER: User = {
  id: '1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  role: 'patient',
  dateOfBirth: null,
  gender: 'male',
};

function renderHeader() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AppHeader heading="Hello" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function openProfile() {
  renderHeader();
  await userEvent.click(await screen.findByRole('button', { name: /Asha/ }));
  await userEvent.click(await screen.findByRole('menuitem', { name: 'Profile' }));
  return screen.findByRole('dialog', { name: 'Profile' });
}

describe('Profile dialog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authApi.getMe).mockResolvedValue(USER);
  });

  it('offers Profile and Log out in the user menu', async () => {
    renderHeader();

    await userEvent.click(await screen.findByRole('button', { name: /Asha/ }));

    expect(await screen.findByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });

  it('opens from the user menu and shows the current gender', async () => {
    const dialog = await openProfile();

    expect(dialog).toHaveTextContent('asha@example.com');
    expect(screen.getByRole('radio', { name: 'Male' })).toBeChecked();
  });

  it('changes the gender at once and saves it', async () => {
    vi.mocked(genderApi.updateGender).mockResolvedValue({ ...USER, gender: 'other' });
    await openProfile();

    await userEvent.click(screen.getByRole('radio', { name: 'Other' }));

    expect(screen.getByRole('radio', { name: 'Other' })).toBeChecked();
    expect(genderApi.updateGender).toHaveBeenCalledWith('other');
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it('puts the old gender back and says so when saving fails', async () => {
    vi.mocked(genderApi.updateGender).mockRejectedValue(new Error('Network'));
    await openProfile();

    await userEvent.click(screen.getByRole('radio', { name: 'Female' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Male' })).toBeChecked());
  });
});
