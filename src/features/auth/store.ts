import type { PublicUser } from '@chat/shared';
import { create } from 'zustand';

/**
 * loading         → don't know yet (first load, checking the refresh cookie)
 * authenticated   → signed in, access token in memory
 * unauthenticated → no valid session; go to /login
 * error           → could not reach the server to check
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthState {
  status: AuthStatus;
  user: PublicUser | null;
  /** Kept in memory only (never localStorage), so XSS cannot read it from storage. */
  accessToken: string | null;
  setSession: (user: PublicUser, accessToken: string) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ status: 'authenticated', user, accessToken }),
  clearSession: () => set({ status: 'unauthenticated', user: null, accessToken: null }),
  setStatus: (status) => set({ status }),
}));

/** The signed-in user. Only use inside the authenticated (chat) area. */
export function useCurrentUser(): PublicUser {
  const user = useAuthStore((state) => state.user);
  if (!user) throw new Error('useCurrentUser() used outside an authenticated area');
  return user;
}
