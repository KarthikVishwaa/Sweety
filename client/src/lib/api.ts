import axios, { isAxiosError } from 'axios';

export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  error?: { message?: string; details?: FieldErrors };
}

const NETWORK_MESSAGE = 'Unable to reach the server. Check your connection and try again.';
const FALLBACK_MESSAGE = 'Something went wrong. Please try again.';

function toApiError(error: unknown): ApiError {
  if (!isAxiosError<ErrorBody>(error)) return new ApiError(FALLBACK_MESSAGE);
  if (!error.response) return new ApiError(NETWORK_MESSAGE);

  const { status, data } = error.response;
  return new ApiError(data?.error?.message ?? FALLBACK_MESSAGE, status, data?.error?.details);
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 10_000,
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiError(error)),
);
