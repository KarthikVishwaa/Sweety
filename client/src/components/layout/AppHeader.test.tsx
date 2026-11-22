import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppHeader } from '@/components/layout/AppHeader';
import * as authApi from '@/features/auth/authApi';
import type { User } from '@/features/auth/types';

vi.mock('@/features/auth/authApi');

const USER: User = {
  id: '1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  role: 'patient',
  dateOfBirth: null,
  gender: 'male',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function renderHeader() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<AppHeader heading="Hello" />} />
          <Route path="/profile" element={<p>Profile page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('the user menu in the header', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(authApi.getMe).mockResolvedValue(USER);
  });

  it('offers Profile and Log out', async () => {
    renderHeader();

    await userEvent.click(await screen.findByRole('button', { name: /Asha/ }));

    expect(await screen.findByRole('menuitem', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Log out' })).toBeInTheDocument();
  });

  it('takes you to the profile page, without opening a dialog', async () => {
    renderHeader();
    await userEvent.click(await screen.findByRole('button', { name: /Asha/ }));

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Profile' }));

    expect(await screen.findByText('Profile page')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
