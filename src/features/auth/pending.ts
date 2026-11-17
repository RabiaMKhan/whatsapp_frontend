import { AUTH_CODE } from '@chat/shared';

/*
 * Remembers which email is waiting for a code between pages
 * (register → verify-email, forgot-password → reset-password).
 * sessionStorage: survives a refresh, gone when the tab closes, and the
 * email never goes into the URL (URLs end up in history and server logs).
 */

export type PendingFlow = 'verify' | 'reset';

interface Pending {
  email: string;
  flow: PendingFlow;
  /** When the last code was sent (ms), for the resend countdown. */
  sentAt: number;
}

const KEY = 'relay-pending-auth';

export function savePending(email: string, flow: PendingFlow, sentAt = Date.now()): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ email, flow, sentAt } satisfies Pending));
  } catch {
    // Storage blocked: the page asks for the email instead.
  }
}

export function readPending(flow: PendingFlow): Pending | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as Pending | null;
    return value?.flow === flow && typeof value.email === 'string' ? value : null;
  } catch {
    return null;
  }
}

export function clearPending(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Seconds left before another code may be requested. */
export function cooldownLeft(sentAt: number | undefined): number {
  if (!sentAt) return 0;
  const left = AUTH_CODE.RESEND_COOLDOWN_SECONDS - Math.floor((Date.now() - sentAt) / 1000);
  return Math.max(0, left);
}
