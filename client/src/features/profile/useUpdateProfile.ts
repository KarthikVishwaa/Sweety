import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { User } from '@/features/auth/types';
import { ME_KEY } from '@/features/auth/useAuth';
import { updateProfile, type ProfileChanges } from './profileApi';

// A change shows at once and is saved in the background; if the server says no it is undone and the
// person is told.
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: ProfileChanges) => updateProfile(changes),
    onMutate: async (changes: ProfileChanges) => {
      await queryClient.cancelQueries({ queryKey: ME_KEY });
      const previous = queryClient.getQueryData<User | null>(ME_KEY);
      if (previous) queryClient.setQueryData<User>(ME_KEY, { ...previous, ...changes });
      return { previous };
    },
    onError: (_error, _changes, context) => {
      queryClient.setQueryData(ME_KEY, context?.previous ?? null);
      toast.error('Could not update your profile. Please try again.');
    },
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
      toast.success('Profile updated');
    },
  });
}
