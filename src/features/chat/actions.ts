'use client';

import { REALTIME } from '@chat/shared';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/features/auth/store';
import { getErrorMessage } from '@/lib/api/http';
import { chatApi } from './api';
import { applyMessageToConversations, setUnreadCount, upsertMessage } from './cache';
import type { ChatMessage } from './types';

/* ---------------------------------------------------------------- read */

/** Clear the badge now and tell the server (which sends read receipts to the others). */
export function markConversationRead(queryClient: QueryClient, conversationId: string): void {
  setUnreadCount(queryClient, conversationId, 0);
  chatApi.markRead(conversationId).catch(() => {});
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
 *  2. POST it to the API (which saves it and publishes message:new with Ably).
 *  3. Success → swap in the saved message. Error/timeout → status "failed".
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
        const saved = await chatApi.sendMessage(conversationId, { body, clientId });
        upsertMessage(queryClient, saved);
        applyMessageToConversations(queryClient, saved, { countAsUnread: false });
      } catch (error) {
        upsertMessage(queryClient, { ...optimistic, status: 'failed' });
        toast.error(getErrorMessage(error));
      }
    },
    [queryClient, me.id, conversationId],
  );
}

/* -------------------------------------------------------------- typing */

const TYPING_REPEAT_MS = REALTIME.TYPING_REPEAT_SECONDS * 1000; // repeat "typing" while the user keeps typing
const TYPING_IDLE_MS = 4_000; // no keystroke for this long → typing:stop

/** Call ping() on every keystroke; stop() when the message is sent or cleared. */
export function useTypingEmitter(conversationId: string) {
  const lastStart = useRef(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const stop = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (!lastStart.current) return;
    lastStart.current = 0;
    chatApi.setTyping(conversationId, false).catch(() => {});
  }, [conversationId]);

  const ping = useCallback(() => {
    const now = Date.now();
    if (now - lastStart.current > TYPING_REPEAT_MS) {
      chatApi.setTyping(conversationId, true).catch(() => {});
      lastStart.current = now;
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stop, TYPING_IDLE_MS);
  }, [conversationId, stop]);

  // Leaving the chat (or Next hiding it) ends "typing".
  useEffect(() => stop, [stop]);

  return { ping, stop };
}
