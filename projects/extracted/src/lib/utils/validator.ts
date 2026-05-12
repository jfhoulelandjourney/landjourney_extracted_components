export class ValidationError extends Error {
  override name = 'ValidationError';

  constructor(
    message: string,
    options: {
      cause: unknown;
    }
  ) {
    super(message, options);
  }
}
