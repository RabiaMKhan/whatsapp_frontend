'use client';

import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { chatApi, chatKeys } from './api';
import { upsertConversation } from './cache';
import type { MessagesPage } from './types';

/*
 * staleTime: Infinity → socket events keep this data fresh, so no polling or
 * refetch-on-focus. After a reconnect, ChatRealtime invalidates everything.
 */

export function useConversations() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: chatApi.listConversations,
    staleTime: Infinity,
  });
}

/**
 * One conversation, taken from the list. Opened by a direct link and not in
 * the list yet → fetched on its own and added to the list.
 */
export function useConversation(conversationId: string) {
  const queryClient = useQueryClient();
  const list = useConversations();
  const fromList = list.data?.find((c) => c.id === conversationId);

  const single = useQuery({
    queryKey: chatKeys.conversation(conversationId),
    queryFn: async () => {
      const conversation = await chatApi.getConversation(conversationId);
      upsertConversation(queryClient, conversation);
      return conversation;
    },
    enabled: list.isSuccess && !fromList,
    retry: false,
  });

  return {
    conversation: fromList ?? single.data,
    isLoading: list.isPending || (!fromList && single.isPending && single.fetchStatus !== 'idle'),
    error: list.error ?? single.error,
  };
}

/** Message history, newest page first. fetchNextPage() loads older messages. */
export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: ({ pageParam }) => chatApi.listMessages(conversationId, pageParam) as Promise<MessagesPage>,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: Infinity,
  });
}

export function useUserSearch(search: string, enabled = true) {
  return useQuery({
    queryKey: chatKeys.users(search),
    queryFn: () => chatApi.searchUsers(search),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    enabled,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createConversation,
    onSuccess: ({ conversation }) => upsertConversation(queryClient, conversation),
  });
}

export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
