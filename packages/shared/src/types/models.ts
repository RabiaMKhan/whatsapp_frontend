/**
 * JSON shapes sent over the wire (REST + Socket.io).
 * Dates are ISO strings. Ids are strings.
 */

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  /** Hex color used for the avatar fallback. */
  avatarColor: string;
  lastSeenAt: string | null;
  createdAt: string;
}

export type ConversationType = 'direct' | 'group';
export type MemberRole = 'owner' | 'member';

export interface ConversationMember {
  user: PublicUser;
  role: MemberRole;
  lastReadAt: string | null;
  joinedAt: string;
}

export interface MessagePreview {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  /** Set for groups. For direct chats, show the other member's name. */
  name: string | null;
  members: ConversationMember[];
  lastMessage: MessagePreview | null;
  /** Unread messages for the user who asked (capped at LIMITS.UNREAD_CAP). */
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = 'text' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  type: MessageType;
  clientId: string | null;
  createdAt: string;
  editedAt: string | null;
}

export type InviteStatus = 'pending' | 'joined';

/** An email invite the signed-in user sent. */
export interface Invite {
  id: string;
  email: string;
  status: InviteStatus;
  /** Last time the invite email went out (re-inviting updates it). */
  lastSentAt: string;
  joinedAt: string | null;
}

/* ---------- REST responses ---------- */

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
}

/** Sign-up does not sign you in: the email must be verified first. */
export interface RegisterResponse {
  email: string;
  verificationRequired: true;
  message: string;
}

export interface MessageOnlyResponse {
  message: string;
}

export interface MeResponse {
  user: PublicUser;
}

export interface UsersResponse {
  users: PublicUser[];
}

export interface ConversationsResponse {
  conversations: Conversation[];
}

export interface ConversationResponse {
  conversation: Conversation;
}

export interface CreateConversationResponse {
  conversation: Conversation;
  /** false when a direct chat with that user already existed. */
  created: boolean;
}

export interface MessagesResponse {
  /** Oldest first. */
  messages: Message[];
  /** Pass as `before` to load older messages. null = no more. */
  nextCursor: string | null;
}

export interface MessageResponse {
  message: Message;
}

export interface ReadResponse {
  lastReadAt: string;
}

/**
 * POST /api/invites. If the person already has an account, no email is sent
 * and their profile comes back instead, so the app can offer to start a chat.
 */
export type CreateInviteResponse =
  | { status: 'sent'; invite: Invite }
  | { status: 'already_member'; user: PublicUser };

export interface InvitesResponse {
  invites: Invite[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
