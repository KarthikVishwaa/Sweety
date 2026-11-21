import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as authApi from './authApi';
import type { LoginInput, SignupInput } from './auth.schemas';
import type { User } from './types';

const ME_KEY = ['me'] as const;

export function useMe() {
  return useQuery({ queryKey: ME_KEY, queryFn: authApi.getMe, retry: false });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (user: User) => {
      queryClient.setQueryData(ME_KEY, user);
      toast.success(`Welcome back, ${user.name}`);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignupInput) => authApi.register(input),
    onSuccess: (user: User) => {
      queryClient.setQueryData(ME_KEY, user);
      toast.success('Account created');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(ME_KEY, null);
      toast.success('Logged out');
    },
  });
}
