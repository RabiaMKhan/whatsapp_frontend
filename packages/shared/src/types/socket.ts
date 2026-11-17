import type { ConversationRef, SendMessageInput } from '../schemas/message';
import type { Conversation, Message } from './models';

/**
 * The Socket.io event contract. Both `new Server<...>()` on the backend and
 * `io()` on the frontend are typed with these, so an event name or payload
 * that does not match is a compile error on both sides.
 */

export type AckResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export type Ack<T> = (response: AckResponse<T>) => void;

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

export interface PresencePayload {
  userId: string;
  online: boolean;
  lastSeenAt: string | null;
}

/** Events the server sends to clients. */
export interface ServerToClientEvents {
  'message:new': (message: Message) => void;
  /** You were added to a conversation (someone started a chat with you). */
  'conversation:new': (conversation: Conversation) => void;
  'conversation:read': (payload: ReadReceiptPayload) => void;
  'typing:update': (payload: TypingPayload) => void;
  /** Sent once right after connecting. */
  'presence:snapshot': (payload: { onlineUserIds: string[] }) => void;
  'presence:update': (payload: PresencePayload) => void;
}

/** Events clients send to the server. */
export interface ClientToServerEvents {
  'message:send': (payload: SendMessageInput, ack: Ack<Message>) => void;
  'conversation:read': (payload: ConversationRef, ack: Ack<{ lastReadAt: string }>) => void;
  'typing:start': (payload: ConversationRef) => void;
  'typing:stop': (payload: ConversationRef) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InterServerEvents {}

/** Data the server keeps on each socket after the auth handshake. */
export interface SocketData {
  userId: string;
  name: string;
}
