import type { ApiErrorBody } from './types';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: unknown[] = [],
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function parseApiError(response: Response): Promise<ApiError> {
  let body: Partial<ApiErrorBody> = {};
  try {
    body = (await response.json()) as Partial<ApiErrorBody>;
  } catch {
    /* non-JSON upstream failure */
  }
  return new ApiError(
    response.status,
    body.code ?? 'REQUEST_FAILED',
    body.message ?? `Request failed (${response.status})`,
    body.details ?? [],
    body.requestId,
  );
}
