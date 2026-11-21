import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api';

export function applyApiError<T extends FieldValues>(
  error: Error,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): string | undefined {
  let mappedToField = false;

  if (error instanceof ApiError && error.fieldErrors) {
    for (const field of fields) {
      const message = error.fieldErrors[field];
      if (message) {
        setError(field, { type: 'server', message });
        mappedToField = true;
      }
    }
  }

  return mappedToField ? undefined : error.message;
}
