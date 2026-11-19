import { z } from 'zod';
import { LIMITS } from '../constants';
import { objectIdSchema } from './common';

export const sendMessageSchema = z.object({
  conversationId: objectIdSchema,
  body: z.string().trim().min(1, 'Message cannot be empty').max(LIMITS.MESSAGE_MAX, 'Message is too long'),
  /**
   * Random id made by the client (e.g. crypto.randomUUID()).
   * Lets the client match its optimistic message to the saved one,
   * and makes retries safe: the same clientId is never saved twice.
   */
  clientId: z.string().trim().min(1).max(64),
});

export const conversationRefSchema = z.object({
  conversationId: objectIdSchema,
});

/** POST /api/conversations/:id/typing */
export const typingSchema = z.object({
  isTyping: z.boolean(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type TypingInput = z.infer<typeof typingSchema>;
export type ConversationRef = z.infer<typeof conversationRefSchema>;
