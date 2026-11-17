import type { Message } from '@chat/shared';
import type { InfiniteData } from '@tanstack/react-query';

/** Set only on messages that exist in this tab and not (yet) on the server. */
export type MessageStatus = 'sending' | 'failed';

export type ChatMessage = Message & { status?: MessageStatus };

export interface MessagesPage {
  /** Oldest first. */
  messages: ChatMessage[];
  nextCursor: string | null;
}

/** pages[0] is the newest page; later pages are older history. */
export type MessagesData = InfiniteData<MessagesPage, string | undefined>;
