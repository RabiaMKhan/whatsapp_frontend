import type { Conversation, Message } from './models';

/**
 * The real-time contract. The API publishes these events with Ably to each
 * member's private channel (`user:<id>`, see userChannel()); the web app
 * subscribes to its own channel. Typed on both sides, so an event name or
 * payload that does not match is a compile error.
 */

export interface TypingPayload {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface ReadReceiptPayload {
  conversationId: string;
  userId: string;
  lastReadAt: string;
}

/** Someone came online or went offline (built from Ably presence in the app). */
export interface PresencePayload {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}

/** Events the API publishes to `user:<id>` channels. */
export interface RealtimeEvents {
  'message:new': Message;
  /** You were added to a conversation (someone started a chat with you). */
  'conversation:new': Conversation;
  'conversation:read': ReadReceiptPayload;
  'typing:update': TypingPayload;
}

export type RealtimeEventName = keyof RealtimeEvents;
