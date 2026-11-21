export type ErrorDetails = Record<string, string>;

export class AppError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code: string,
    readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
