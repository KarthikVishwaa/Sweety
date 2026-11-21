import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/features/auth/authApi';
import { LoginPage } from './LoginPage';

vi.mock('@/features/auth/authApi');

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows validation errors and does not submit an empty form', async () => {
    renderLoginPage();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(authApi.login).not.toHaveBeenCalled();
  });

  it('calls the login mutation with the entered values', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      id: '1',
      name: 'Asha Rao',
      email: 'asha@example.com',
      role: 'patient',
      dateOfBirth: null,
    });
    renderLoginPage();

    await userEvent.type(screen.getByLabelText('Email'), 'Asha@Example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'sweet1234');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'asha@example.com',
        password: 'sweet1234',
      });
    });
  });
});
