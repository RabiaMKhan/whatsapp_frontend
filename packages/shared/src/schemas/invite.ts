import { z } from 'zod';
import { emailSchema } from './common';

/** POST /api/invites: invite someone to join by email. */
export const createInviteSchema = z.object({
  email: emailSchema,
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
