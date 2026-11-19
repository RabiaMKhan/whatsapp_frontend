import type { CreateInviteInput, CreateInviteResponse, InvitesResponse } from '@chat/shared';
import { api } from '@/lib/api/client';

export const inviteKeys = {
  all: ['invites'] as const,
};

export const invitesApi = {
  /** Invites I sent, newest first. */
  async list() {
    const { data } = await api.get<InvitesResponse>('/invites');
    return data.invites;
  },

  /** Sends the email, or returns the existing account if they're already a member. */
  async create(input: CreateInviteInput) {
    const { data } = await api.post<CreateInviteResponse>('/invites', input);
    return data;
  },
};
