import type { InternalAxiosRequestConfig } from 'axios';
import { refreshSession } from '@/features/auth/session';
import { useAuthStore } from '@/features/auth/store';
import { createHttpClient, toApiError } from './http';

/**
 * The axios instance for authenticated API calls.
 *  - Adds `Authorization: Bearer <access token>`.
 *  - On 401, refreshes the token once and retries the request.
 *  - Rejects with an ApiError that has a user-friendly message.
 */
export const api = createHttpClient();

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(undefined, async (error) => {
  const config = error?.config as RetriableConfig | undefined;

  if (error?.response?.status === 401 && config && !config._retried) {
    config._retried = true;
    try {
      await refreshSession();
      return api(config); // the request interceptor adds the new token
    } catch {
      // Refresh failed: the session is cleared and the AuthGate sends the user to /login.
    }
  }
  throw toApiError(error);
});
