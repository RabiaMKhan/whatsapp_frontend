'use client';

import type { ServerToClientEvents } from '@chat/shared';
import { useEffect, useEffectEvent } from 'react';
import { useSocketStore, type ChatSocket } from './store';

export function useSocket(): ChatSocket | null {
  return useSocketStore((state) => state.socket);
}

export function useConnectionStatus() {
  return useSocketStore((state) => state.status);
}

type Listener<E extends keyof ServerToClientEvents> = ServerToClientEvents[E];

/**
 * Subscribe to a server event for as long as the component is mounted.
 * The handler can use the latest props/state without re-subscribing.
 *
 *   useSocketEvent('message:new', (message) => { ... })
 */
export function useSocketEvent<E extends keyof ServerToClientEvents>(event: E, handler: Listener<E>): void {
  const socket = useSocket();
  const onEvent = useEffectEvent((...args: Parameters<Listener<E>>) => {
    (handler as (...a: Parameters<Listener<E>>) => void)(...args);
  });

  useEffect(() => {
    if (!socket) return;
    const listener = (...args: Parameters<Listener<E>>) => onEvent(...args);
    // socket.io's generic types can't follow a generic event name, hence the casts.
    const untyped = socket as unknown as {
      on: (e: string, l: (...a: unknown[]) => void) => void;
      off: (e: string, l: (...a: unknown[]) => void) => void;
    };
    untyped.on(event, listener as (...a: unknown[]) => void);
    return () => untyped.off(event, listener as (...a: unknown[]) => void);
  }, [socket, event]);
}
