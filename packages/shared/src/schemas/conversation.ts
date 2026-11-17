import { z } from 'zod';
import { LIMITS } from '../constants';
import { objectIdSchema } from './common';

export const createConversationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('direct'),
    userId: objectIdSchema,
  }),
  z.object({
    type: z.literal('group'),
    name: z.string().trim().min(1, 'Group name is required').max(LIMITS.GROUP_NAME_MAX),
    memberIds: z
      .array(objectIdSchema)
      .min(2, 'Pick at least 2 people for a group')
      .max(LIMITS.GROUP_MEMBERS_MAX, `A group can have at most ${LIMITS.GROUP_MEMBERS_MAX + 1} members`),
  }),
]);

export const listMessagesQuerySchema = z.object({
  /** Message id cursor: return messages older than this one. */
  before: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(LIMITS.MESSAGES_PAGE_MAX).default(LIMITS.MESSAGES_PAGE_SIZE),
});

export const searchUsersQuerySchema = z.object({
  search: z.string().trim().max(100).default(''),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
