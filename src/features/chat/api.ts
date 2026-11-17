import type {
  ConversationResponse,
  ConversationsResponse,
  CreateConversationInput,
  CreateConversationResponse,
  MessagesResponse,
  ReadResponse,
  UsersResponse,
} from '@chat/shared';
import { api } from '@/lib/api/client';

/** TanStack Query keys, in one place so invalidation never misses one. */
export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) => [...chatKeys.all, 'messages', conversationId] as const,
  users: (search: string) => [...chatKeys.all, 'users', search] as const,
};

export const chatApi = {
  async listConversations() {
    const { data } = await api.get<ConversationsResponse>('/conversations');
    return data.conversations;
  },

  async getConversation(id: string) {
    const { data } = await api.get<ConversationResponse>(`/conversations/${id}`);
    return data.conversation;
  },

  async createConversation(input: CreateConversationInput) {
    const { data } = await api.post<CreateConversationResponse>('/conversations', input);
    return data;
  },

  /** One page, oldest first. Pass `nextCursor` back as `before` for older messages. */
  async listMessages(conversationId: string, before?: string) {
    const { data } = await api.get<MessagesResponse>(`/conversations/${conversationId}/messages`, {
      params: before ? { before } : undefined,
    });
    return data;
  },

  async markRead(conversationId: string) {
    const { data } = await api.post<ReadResponse>(`/conversations/${conversationId}/read`);
    return data;
  },

  async searchUsers(search: string) {
    const { data } = await api.get<UsersResponse>('/users', { params: { search } });
    return data.users;
  },
};
