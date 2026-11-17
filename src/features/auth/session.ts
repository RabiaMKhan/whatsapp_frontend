import type {
  AuthResponse,
  EmailOnlyInput,
  LoginInput,
  MessageOnlyResponse,
  RegisterInput,
  RegisterResponse,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@chat/shared';
import { http, toApiError } from '@/lib/api/http';
import { useAuthStore } from './store';

/*
 * Session flow:
 *  - register → API emails a 6-digit code (no session yet)
 *  - verifyEmail → API returns an access token (kept in memory) and sets an
 *    httpOnly refresh cookie. Same for login.
 *  - On page load, or when the access token expires, POST /auth/refresh uses
 *    the cookie to get a new access token.
 */

const post = async <T>(url: string, body?: unknown): Promise<T> => {
  try {
    const { data } = await http.post<T>(url, body);
    return data;
  } catch (error) {
    throw toApiError(error);
  }
};

export async function login(input: LoginInput): Promise<AuthResponse> {
  const data = await post<AuthResponse>('/auth/login', input);
  useAuthStore.getState().setSession(data.user, data.accessToken);
  return data;
}

/** Creates the account and emails a code. The user is NOT signed in yet. */
export const register = (input: RegisterInput) => post<RegisterResponse>('/auth/register', input);

/** Correct code → verified and signed in. */
export async function verifyEmail(input: VerifyEmailInput): Promise<AuthResponse> {
  const data = await post<AuthResponse>('/auth/verify-email', input);
  useAuthStore.getState().setSession(data.user, data.accessToken);
  return data;
}

export const resendVerification = (input: EmailOnlyInput) =>
  post<MessageOnlyResponse>('/auth/resend-verification', input);

export const forgotPassword = (input: EmailOnlyInput) => post<MessageOnlyResponse>('/auth/forgot-password', input);

export const resetPassword = (input: ResetPasswordInput) => post<MessageOnlyResponse>('/auth/reset-password', input);

let refreshInFlight: Promise<AuthResponse> | null = null;

/**
 * Get a new access token from the refresh cookie. Calls made at the same time
 * share one request (the server rotates the cookie, so two would conflict).
 */
export function refreshSession(): Promise<AuthResponse> {
  refreshInFlight ??= http
    .post<AuthResponse>('/auth/refresh')
    .then(({ data }) => {
      useAuthStore.getState().setSession(data.user, data.accessToken);
      return data;
    })
    .catch((error: unknown) => {
      const apiError = toApiError(error);
      const store = useAuthStore.getState();
      if (apiError.status === 401 || apiError.status === 403) store.clearSession();
      // Server unreachable: keep the user signed in if they already were.
      else if (store.status !== 'authenticated') store.setStatus('error');
      throw apiError;
    })
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

/** On first load: restore the session from the refresh cookie, once. */
export function bootstrapSession(): void {
  if (useAuthStore.getState().status !== 'loading') return;
  refreshSession().catch(() => {
    // Status is already set to unauthenticated or error.
  });
}

/** Retry after an "error" status (server was down). */
export function retryBootstrap(): void {
  useAuthStore.getState().setStatus('loading');
  bootstrapSession();
}

export async function logout(): Promise<void> {
  try {
    await http.post('/auth/logout');
  } catch {
    // Even if the request fails, sign out locally.
  }
  // Full page load wipes every bit of in-memory state (queries, socket,
  // drafts kept alive by Next's Activity), so nothing leaks to the next user.
  // This is what the Next.js "Preserving UI state" guide recommends for logout.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign('/login');
}
