'use client';

import { APP_NAME } from '@chat/shared';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowDownIcon, MessageSquareOffIcon } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/store';
import { markConversationRead, useSendMessage } from '../actions';
import { useConversation } from '../hooks';
import { useActiveConversationStore } from '../stores';
import { getConversationTitle } from '../utils';
import { Composer } from './composer';
import { ConversationHeader } from './conversation-header';
import { MessageList } from './message-list';

/** Unwraps the route params. Keyed by id so each chat gets fresh local state (draft, scroll). */
export function ConversationRoute({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  return <ConversationView key={conversationId} conversationId={conversationId} />;
}

function ConversationView({ conversationId }: { conversationId: string }) {
  const me = useCurrentUser();
  const queryClient = useQueryClient();
  const { conversation, isLoading, error } = useConversation(conversationId);
  const send = useSendMessage(conversationId);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [showJump, setShowJump] = useState(false);
  const title = conversation ? getConversationTitle(conversation, me.id) : null;

  // Tell the realtime layer which chat is on screen (its messages aren't "unread").
  useEffect(() => {
    useActiveConversationStore.setState({ id: conversationId });
    return () => {
      if (useActiveConversationStore.getState().id === conversationId) {
        useActiveConversationStore.setState({ id: null });
      }
    };
  }, [conversationId]);

  // Opening the chat (or coming back to the tab) marks it as read.
  const unread = conversation?.unreadCount ?? 0;
  useEffect(() => {
    if (!unread) return;
    const markIfVisible = () => {
      if (document.visibilityState === 'visible') markConversationRead(queryClient, conversationId);
    };
    markIfVisible();
    document.addEventListener('visibilitychange', markIfVisible);
    return () => document.removeEventListener('visibilitychange', markIfVisible);
  }, [unread, conversationId, queryClient]);

  useDocumentTitle(title ? `${title} · ${APP_NAME}` : null);

  // The scroller is flex-col-reverse: scrollTop 0 is the bottom (newest message),
  // and it goes negative as you scroll up. Older pages load at the top without
  // the view jumping, and new messages stay in view.
  const scrollToBottom = (smooth: boolean) =>
    scrollerRef.current?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });

  if (isLoading) return <ConversationSkeleton />;

  if (error || !conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <MessageSquareOffIcon className="size-5" />
        </div>
        <div>
          <p className="font-medium">Conversation not found</p>
          <p className="mt-1 text-sm text-muted-foreground">It doesn&apos;t exist, or you&apos;re not a member.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/chat">Back to messages</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ConversationHeader conversation={conversation} meId={me.id} />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollerRef}
          onScroll={(event) => setShowJump(event.currentTarget.scrollTop < -400)}
          className="flex min-h-0 flex-1 flex-col-reverse overflow-y-auto overscroll-contain"
        >
          <MessageList
            conversation={conversation}
            meId={me.id}
            scrollerRef={scrollerRef}
            onRetry={(message) => void send(message.body, message)}
          />
        </div>
        {showJump && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-4 bottom-4 rounded-full bg-background shadow-md"
            onClick={() => scrollToBottom(true)}
            aria-label="Jump to latest message"
          >
            <ArrowDownIcon />
          </Button>
        )}
      </div>

      <Composer
        conversationId={conversationId}
        placeholder={`Message ${title}`}
        onSend={(body) => {
          void send(body);
          scrollToBottom(false);
        }}
      />
    </div>
  );
}

/**
 * The title depends on data only the browser has (the chat name), so it can't
 * come from Next's metadata. Next writes its own title after navigating, so
 * re-apply ours whenever <head> changes while this chat is on screen.
 */
function useDocumentTitle(title: string | null) {
  useEffect(() => {
    if (!title) return;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [title]);
}

export function ConversationSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy aria-label="Loading conversation">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
        <Skeleton className="size-8 rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex-1" />
      <div className="border-t bg-background px-6 py-3">
        <Skeleton className="mx-auto h-12 max-w-3xl rounded-2xl" />
      </div>
    </div>
  );
}
