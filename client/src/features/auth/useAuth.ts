import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as authApi from './authApi';
import type { LoginInput, SignupInput } from './auth.schemas';
import type { User } from './types';

export const ME_KEY = ['me'] as const;

function discardUserData(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== ME_KEY[0] });
}

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: authApi.getMe, retry: false });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (user: User) => {
      discardUserData(queryClient);
      queryClient.setQueryData(ME_KEY, user);
      toast.success(`Welcome back, ${user.name}`);
    },
  });
}

export function useRegister({ onRegistered }: { onRegistered?: (user: User) => void } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignupInput) => authApi.register(input),
    onSuccess: (user: User) => {
      onRegistered?.(user);
      discardUserData(queryClient);
      queryClient.setQueryData(ME_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      discardUserData(queryClient);
      queryClient.setQueryData(ME_KEY, null);
      toast.success('Logged out');
    },
  });
}
