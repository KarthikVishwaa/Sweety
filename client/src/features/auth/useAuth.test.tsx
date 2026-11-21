import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from './authApi';
import { useLogin, useLogout } from './useAuth';

vi.mock('./authApi');

const user = {
  id: '2',
  name: 'Ben',
  email: 'ben@example.com',
  role: 'patient' as const,
  dateOfBirth: null,
};

function setup() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(['me'], { ...user, id: '1', name: 'Asha' });
  queryClient.setQueryData(['readings', '2026-11-21'], [{ id: 'asha-reading' }]);

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('session cache handling', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('discards the previous user’s readings on logout', async () => {
    vi.mocked(authApi.logout).mockResolvedValue();
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useLogout(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(queryClient.getQueryData(['me'])).toBeNull());
    expect(queryClient.getQueryData(['readings', '2026-11-21'])).toBeUndefined();
  });

  it('discards the previous user’s readings when someone else logs in', async () => {
    vi.mocked(authApi.login).mockResolvedValue(user);
    const { queryClient, wrapper } = setup();
    const { result } = renderHook(() => useLogin(), { wrapper });

    result.current.mutate({ email: user.email, password: 'secret123' });

    await waitFor(() => expect(queryClient.getQueryData(['me'])).toEqual(user));
    expect(queryClient.getQueryData(['readings', '2026-11-21'])).toBeUndefined();
  });
});
