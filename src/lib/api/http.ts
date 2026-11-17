import axios, { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@chat/shared';
import { env } from '@/config/env';

export function createHttpClient() {
  return axios.create({
    baseURL: `${env.apiUrl}/api`,
    // Send/receive the httpOnly refresh cookie on cross-origin requests.
    withCredentials: true,
    timeout: 15_000,
    // The API requires this on cookie routes (CSRF guard).
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
}

/**
 * Bare instance with no interceptors, so the refresh call can use it without
 * looping. App code uses `api` from ./client instead.
 */
export const http = createHttpClient();

export class ApiError extends Error {
  readonly status: number | null;
  readonly code: string;
  readonly details: unknown;

  constructor(message: string, status: number | null, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Seconds to wait, when the API says a code was sent too recently. */
  get retryAfterSeconds(): number | null {
    const value = (this.details as { retryAfterSeconds?: unknown } | undefined)?.retryAfterSeconds;
    return typeof value === 'number' ? value : null;
  }
}

/** Turn any thrown value into an ApiError with a message that is safe to show. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isAxiosError<ApiErrorBody>(error)) {
    const body = error.response?.data?.error;
    if (body) return new ApiError(body.message, error.response?.status ?? null, body.code, body.details);
    if (!error.response) {
      return new ApiError("Can't reach the server. Check your connection and try again.", null, 'NETWORK_ERROR');
    }
    return new ApiError('Something went wrong. Please try again.', error.response.status, 'UNKNOWN');
  }
  return new ApiError('Something went wrong. Please try again.', null, 'UNKNOWN');
}

export const getErrorMessage = (error: unknown) => toApiError(error).message;
