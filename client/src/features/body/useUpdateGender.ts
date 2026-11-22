import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ME_KEY } from '@/features/auth/useAuth';
import type { User } from '@/features/auth/types';
import { updateGender } from './genderApi';
import type { Gender } from './bodyProportions';

// The figure switches at once; if the server says no, it switches back and the person is told.
export function useUpdateGender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (gender: Gender) => updateGender(gender),
    onMutate: async (gender: Gender) => {
      await queryClient.cancelQueries({ queryKey: ME_KEY });
      const previous = queryClient.getQueryData<User | null>(ME_KEY);
      if (previous) queryClient.setQueryData<User>(ME_KEY, { ...previous, gender });
      return { previous };
    },
    onError: (_error, _model, context) => {
      queryClient.setQueryData(ME_KEY, context?.previous ?? null);
      toast.error('Could not change your gender. Please try again.');
    },
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
      toast.success('Gender updated');
    },
  });
}
