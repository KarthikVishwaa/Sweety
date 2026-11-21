import { ApiError } from '@/lib/api';

interface FieldError {
  type: string;
  message: string;
}

export function applyApiError<Field extends string>(
  error: Error,
  fields: readonly Field[],
  setError: (field: Field, fieldError: FieldError) => void,
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
