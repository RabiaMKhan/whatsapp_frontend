'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/store';
import { startRealtime, stopRealtime } from './store';

/**
 * Connects to Ably while the signed-in area is on screen and disconnects when
 * it leaves (sign-out, or Next.js hiding the route with <Activity>).
 */
export function RealtimeLifecycle() {
  const me = useCurrentUser();
  useEffect(() => {
    startRealtime(me.id);
    return stopRealtime;
  }, [me.id]);
  return null;
}
