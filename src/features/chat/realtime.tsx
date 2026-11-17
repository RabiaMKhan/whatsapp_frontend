'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/store';
import { useSocket, useSocketEvent } from '@/lib/socket/hooks';
import { scheduleMarkRead } from './actions';
import { chatKeys } from './api';
import { applyMessageToConversations, applyReadReceipt, upsertConversation, upsertMessage } from './cache';
import { isViewing, useTypingStore } from './stores';

/**
 * Bridges socket events into the query cache. Mounted once in the chat shell,
 * so updates arrive even for chats that aren't open.
 */
export function ChatRealtime() {
  const queryClient = useQueryClient();
  const me = useCurrentUser();
  const socket = useSocket();
  const setTyping = useTypingStore((state) => state.setTyping);

  useSocketEvent('message:new', (message) => {
    upsertMessage(queryClient, message);
    setTyping(message.conversationId, message.senderId, false);

    const mine = message.senderId === me.id;
    const viewing = isViewing(message.conversationId);
    const known = applyMessageToConversations(queryClient, message, { countAsUnread: !mine && !viewing });
    if (!known) void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    if (!mine && viewing) scheduleMarkRead(queryClient, message.conversationId);
  });

  useSocketEvent('conversation:new', (conversation) => upsertConversation(queryClient, conversation));

  useSocketEvent('conversation:read', (payload) => applyReadReceipt(queryClient, payload, me.id));

  useSocketEvent('typing:update', ({ conversationId, userId, isTyping }) => {
    if (userId !== me.id) setTyping(conversationId, userId, isTyping);
  });

  // Events sent while we were disconnected are lost, so refetch after a reconnect.
  useEffect(() => {
    if (!socket) return;
    let hadConnected = socket.connected;
    const onConnect = () => {
      if (hadConnected) void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      hadConnected = true;
    };
    socket.on('connect', onConnect);
    return () => {
      socket.off('connect', onConnect);
    };
  }, [socket, queryClient]);

  return null;
}
