'use client';

import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth/store';
import { useSocketStore } from '@/lib/socket/store';
import { chatApi } from './api';
import { applyMessageToConversations, setUnreadCount, upsertMessage } from './cache';
import type { ChatMessage } from './types';

const SEND_TIMEOUT_MS = 10_000;

/* ---------------------------------------------------------------- read */

/** Clear the badge now and tell the server (which sends read receipts to the others). */
export function markConversationRead(queryClient: QueryClient, conversationId: string): void {
  setUnreadCount(queryClient, conversationId, 0);
  const socket = useSocketStore.getState().socket;
  if (socket?.connected) {
    socket.emit('conversation:read', { conversationId }, () => {});
  } else {
    chatApi.markRead(conversationId).catch(() => {});
  }
}

const readTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Several messages arriving together → one read event. */
export function scheduleMarkRead(queryClient: QueryClient, conversationId: string, delayMs = 400): void {
  clearTimeout(readTimers.get(conversationId));
  readTimers.set(
    conversationId,
    setTimeout(() => {
      readTimers.delete(conversationId);
      markConversationRead(queryClient, conversationId);
    }, delayMs),
  );
}

/* ---------------------------------------------------------------- send */

/**
 * Optimistic send:
 *  1. Show the message right away with status "sending".
 *  2. Emit message:send and wait for the server's ack (max 10 s).
 *  3. Ack ok → swap in the saved message. Error/timeout → status "failed".
 * Retrying reuses the clientId, so if the first try did reach the server,
 * it is not saved twice.
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  const me = useCurrentUser();

  return useCallback(
    async (body: string, retryOf?: ChatMessage) => {
      const clientId = retryOf?.clientId ?? crypto.randomUUID();
      const optimistic: ChatMessage = {
        id: `local:${clientId}`,
        conversationId,
        senderId: me.id,
        body,
        type: 'text',
        clientId,
        createdAt: retryOf?.createdAt ?? new Date().toISOString(),
        editedAt: null,
        status: 'sending',
      };
      upsertMessage(queryClient, optimistic);

      try {
        const socket = useSocketStore.getState().socket;
        if (!socket) throw new Error('You are offline');
        const response = await socket
          .timeout(SEND_TIMEOUT_MS)
          .emitWithAck('message:send', { conversationId, body, clientId });
        if (!response.ok) throw new Error(response.error.message);

        upsertMessage(queryClient, response.data);
        applyMessageToConversations(queryClient, response.data, { countAsUnread: false });
      } catch (error) {
        upsertMessage(queryClient, { ...optimistic, status: 'failed' });
        const message = error instanceof Error && error.message !== 'operation has timed out' ? error.message : null;
        toast.error(message ?? 'Message not sent. Check your connection and retry.');
      }
    },
    [queryClient, me.id, conversationId],
  );
}

/* -------------------------------------------------------------- typing */

const TYPING_REPEAT_MS = 2_500; // resend typing:start while the user keeps typing
const TYPING_IDLE_MS = 4_000; // no keystroke for this long → typing:stop

/** Call ping() on every keystroke; stop() when the message is sent or cleared. */
export function useTypingEmitter(conversationId: string) {
  const lastStart = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (!lastStart.current) return;
    lastStart.current = 0;
    useSocketStore.getState().socket?.emit('typing:stop', { conversationId });
  }, [conversationId]);

  const ping = useCallback(() => {
    const now = Date.now();
    if (now - lastStart.current > TYPING_REPEAT_MS) {
      useSocketStore.getState().socket?.emit('typing:start', { conversationId });
      lastStart.current = now;
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stop, TYPING_IDLE_MS);
  }, [conversationId, stop]);

  // Leaving the chat (or Next hiding it) ends "typing".
  useEffect(() => stop, [stop]);

  return { ping, stop };
}
