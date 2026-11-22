import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ME_KEY } from '@/features/auth/useAuth';
import type { User } from '@/features/auth/types';
import { updateBodyModel } from './bodyModelApi';
import type { BodyModel } from './bodyProportions';

// The figure switches at once; if the server says no, it switches back and the person is told.
export function useUpdateBodyModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBodyModel,
    onMutate: async (bodyModel: BodyModel) => {
      await queryClient.cancelQueries({ queryKey: ME_KEY });
      const previous = queryClient.getQueryData<User | null>(ME_KEY);
      if (previous) queryClient.setQueryData<User>(ME_KEY, { ...previous, bodyModel });
      return { previous };
    },
    onError: (_error, _model, context) => {
      queryClient.setQueryData(ME_KEY, context?.previous ?? null);
      toast.error('Could not change your body model. Please try again.');
    },
    onSuccess: (user) => {
      queryClient.setQueryData(ME_KEY, user);
      toast.success('Body model updated');
    },
  });
}
