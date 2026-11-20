'use client';

import type { RealtimeEventName, RealtimeEvents } from '@chat/shared';
import type { InboundMessage, RealtimeChannel } from '@ably/pubsub-device';
import { useEffect, useEffectEvent } from 'react';
import { useRealtimeStore } from './store';

export function useRealtimeChannel(): RealtimeChannel | null {
  return useRealtimeStore((state) => state.channel);
}

export function useConnectionStatus() {
  return useRealtimeStore((state) => state.status);
}

/**
 * Run `handler` for every `event` the API publishes to my channel, for as long
 * as the component is mounted. The handler can use the latest props/state
 * without re-subscribing.
 *
 *   useRealtimeEvent('message:new', (message) => { ... })
 */
export function useRealtimeEvent<E extends RealtimeEventName>(
  event: E,
  handler: (payload: RealtimeEvents[E]) => void,
): void {
  const channel = useRealtimeChannel();
  const onEvent = useEffectEvent((payload: RealtimeEvents[E]) => handler(payload));

  useEffect(() => {
    if (!channel) return;
    const listener = (message: InboundMessage) => onEvent(message.data as RealtimeEvents[E]);
    void channel.subscribe(event, listener).catch(() => {});
    return () => channel.unsubscribe(event, listener);
  }, [channel, event]);
}
