import { LIMITS, type Conversation, type Message, type ReadReceiptPayload } from '@chat/shared';
import type { QueryClient } from '@tanstack/react-query';
import { chatKeys } from './api';
import type { ChatMessage, MessagesData } from './types';
import { activityTime } from './utils';

/*
 * The TanStack Query cache is the single source of truth for chat data.
 * Socket events and optimistic sends write into it with these helpers;
 * components just read queries and re-render.
 */

/* ------------------------------------------------------------ messages */

// Confirmed messages in time order, then this tab's pending/failed ones at the end.
const sortMessages = (messages: ChatMessage[]) =>
  [...messages].sort(
    (a, b) => Number(Boolean(a.status)) - Number(Boolean(b.status)) || a.createdAt.localeCompare(b.createdAt),
  );

const sameMessage = (a: ChatMessage, b: ChatMessage) =>
  a.id === b.id || (a.clientId !== null && a.clientId === b.clientId && a.senderId === b.senderId);

/**
 * Add a message or replace its earlier version (matched by id, or by clientId
 * for our own optimistic messages). Does nothing if that chat isn't loaded.
 */
export function upsertMessage(queryClient: QueryClient, message: ChatMessage): void {
  queryClient.setQueryData<MessagesData>(chatKeys.messages(message.conversationId), (data) => {
    const [newest, ...older] = data?.pages ?? [];
    if (!data || !newest) return data;
    if (older.some((page) => page.messages.some((m) => m.id === message.id))) return data;

    const index = newest.messages.findIndex((m) => sameMessage(m, message));
    const messages = [...newest.messages];
    if (index >= 0) {
      // Never turn a confirmed message back into a pending one (late ack vs. socket event).
      if (!messages[index]!.status && message.status) return data;
      messages[index] = message;
    } else {
      messages.push(message);
    }
    return { ...data, pages: [{ ...newest, messages: sortMessages(messages) }, ...older] };
  });
}

/* ------------------------------------------------------- conversations */

const sortConversations = (list: Conversation[]) =>
  [...list].sort((a, b) => activityTime(b).localeCompare(activityTime(a)));

function updateConversations(queryClient: QueryClient, update: (list: Conversation[]) => Conversation[]) {
  queryClient.setQueryData<Conversation[]>(chatKeys.conversations(), (list) => (list ? update(list) : list));
}

export function upsertConversation(queryClient: QueryClient, conversation: Conversation): void {
  updateConversations(queryClient, (list) =>
    sortConversations([conversation, ...list.filter((c) => c.id !== conversation.id)]),
  );
}

/**
 * New message → update that chat's preview, move it to the top and (if asked)
 * add one unread. Returns false if the chat isn't in the list yet.
 */
export function applyMessageToConversations(
  queryClient: QueryClient,
  message: Message,
  { countAsUnread }: { countAsUnread: boolean },
): boolean {
  let found = false;
  updateConversations(queryClient, (list) => {
    const conversation = list.find((c) => c.id === message.conversationId);
    if (!conversation) return list;
    found = true;

    const last = conversation.lastMessage;
    if (last && (last.id === message.id || last.createdAt > message.createdAt)) return list;

    const updated: Conversation = {
      ...conversation,
      lastMessage: { id: message.id, body: message.body, senderId: message.senderId, createdAt: message.createdAt },
      unreadCount: countAsUnread ? Math.min(conversation.unreadCount + 1, LIMITS.UNREAD_CAP) : conversation.unreadCount,
    };
    return sortConversations([updated, ...list.filter((c) => c.id !== conversation.id)]);
  });
  return found;
}

export function setUnreadCount(queryClient: QueryClient, conversationId: string, unreadCount: number): void {
  updateConversations(queryClient, (list) =>
    list.map((c) => (c.id === conversationId && c.unreadCount !== unreadCount ? { ...c, unreadCount } : c)),
  );
}

/** Someone read the chat: move their read marker (drives "Seen" receipts). */
export function applyReadReceipt(queryClient: QueryClient, payload: ReadReceiptPayload, meId: string): void {
  updateConversations(queryClient, (list) =>
    list.map((c) => {
      if (c.id !== payload.conversationId) return c;
      return {
        ...c,
        unreadCount: payload.userId === meId ? 0 : c.unreadCount,
        members: c.members.map((member) =>
          member.user.id === payload.userId && (!member.lastReadAt || member.lastReadAt < payload.lastReadAt)
            ? { ...member, lastReadAt: payload.lastReadAt }
            : member,
        ),
      };
    }),
  );
}
