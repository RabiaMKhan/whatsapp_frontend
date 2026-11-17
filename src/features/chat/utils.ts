import type { Conversation, PublicUser } from '@chat/shared';
import { firstName } from '@/lib/format';

/** The other person in a direct chat (null for groups). */
export function getDirectPeer(conversation: Conversation, meId: string): PublicUser | null {
  if (conversation.type !== 'direct') return null;
  return conversation.members.find((member) => member.user.id !== meId)?.user ?? null;
}

export function getConversationTitle(conversation: Conversation, meId: string): string {
  if (conversation.type === 'group') return conversation.name ?? 'Untitled group';
  return getDirectPeer(conversation, meId)?.name ?? 'Deleted account';
}

export function findMember(conversation: Conversation, userId: string): PublicUser | null {
  return conversation.members.find((member) => member.user.id === userId)?.user ?? null;
}

/** "You: sounds good" · "Sara: on it" (groups) · "sounds good" (direct) */
export function getPreview(conversation: Conversation, meId: string): string | null {
  const last = conversation.lastMessage;
  if (!last) return null;
  if (last.senderId === meId) return `You: ${last.body}`;
  if (conversation.type === 'group') {
    const sender = findMember(conversation, last.senderId);
    return `${sender ? firstName(sender.name) : 'Someone'}: ${last.body}`;
  }
  return last.body;
}

/** Newest activity first: last message time, or creation time for empty chats. */
export const activityTime = (conversation: Conversation) => conversation.lastMessage?.createdAt ?? conversation.createdAt;

export function typingLabel(names: string[]): string | null {
  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
  return 'Several people are typing';
}
