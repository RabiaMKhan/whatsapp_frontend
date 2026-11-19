'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/store';
import { useRealtimeChannel, useRealtimeEvent } from '@/lib/realtime/hooks';
import { scheduleMarkRead } from './actions';
import { chatKeys } from './api';
import { applyMessageToConversations, applyReadReceipt, upsertConversation, upsertMessage } from './cache';
import { isViewing, useTypingStore } from './stores';

/**
 * Bridges Ably events (published by the API to my private channel) into the
 * query cache. Mounted once in the chat shell, so updates arrive even for
 * chats that aren't open.
 */
export function ChatRealtime() {
  const queryClient = useQueryClient();
  const me = useCurrentUser();
  const channel = useRealtimeChannel();
  const setTyping = useTypingStore((state) => state.setTyping);

  useRealtimeEvent('message:new', (message) => {
    upsertMessage(queryClient, message);
    setTyping(message.conversationId, message.senderId, false);

    const mine = message.senderId === me.id;
    const viewing = isViewing(message.conversationId);
    const known = applyMessageToConversations(queryClient, message, { countAsUnread: !mine && !viewing });
    if (!known) void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    if (!mine && viewing) scheduleMarkRead(queryClient, message.conversationId);
  });

  useRealtimeEvent('conversation:new', (conversation) => upsertConversation(queryClient, conversation));

  useRealtimeEvent('conversation:read', (payload) => applyReadReceipt(queryClient, payload, me.id));

  useRealtimeEvent('typing:update', ({ conversationId, userId, isTyping }) => {
    if (userId !== me.id) setTyping(conversationId, userId, isTyping);
  });

  // After a short drop Ably resumes and replays what we missed. If the gap was
  // too long (resumed: false), events were lost, so refetch everything.
  useEffect(() => {
    if (!channel) return;
    let attachedBefore = channel.state === 'attached';
    const onAttached = (change: { resumed: boolean }) => {
      if (attachedBefore && !change.resumed) void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      attachedBefore = true;
    };
    channel.on('attached', onAttached);
    return () => channel.off('attached', onAttached);
  }, [channel, queryClient]);

  return null;
}
