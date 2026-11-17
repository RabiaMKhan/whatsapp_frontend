'use client';

import { useEffect } from 'react';
import { startSocket, stopSocket } from './store';

/**
 * Opens the socket while the signed-in area is on screen and closes it when it
 * leaves (sign-out, or Next.js hiding the route with <Activity>).
 */
export function SocketLifecycle() {
  useEffect(() => {
    startSocket();
    return stopSocket;
  }, []);
  return null;
}
