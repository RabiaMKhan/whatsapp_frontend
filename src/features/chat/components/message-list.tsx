'use client';

import type { Conversation, PublicUser } from '@chat/shared';
import { CheckCheckIcon, CheckIcon, ClockIcon, RotateCcwIcon } from 'lucide-react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { UserAvatar } from '@/components/user-avatar';
import { dayKey, firstName, formatDayLabel, formatFullDate, formatMessageTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useMessages } from '../hooks';
import { useTypingUserIds } from '../stores';
import type { ChatMessage } from '../types';
import { findMember, getConversationTitle, typingLabel } from '../utils';
import { ConversationAvatar } from './conversation-avatar';

/** Messages from one sender less than 5 minutes apart are drawn as one group. */
const GROUP_GAP_MS = 5 * 60_000;

type Row =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'system'; key: string; message: ChatMessage }
  | { kind: 'group'; key: string; senderId: string; mine: boolean; messages: ChatMessage[] };

function buildRows(messages: ChatMessage[], meId: string): Row[] {
  const rows: Row[] = [];
  let lastDay = '';
  let group: Extract<Row, { kind: 'group' }> | null = null;

  for (const message of messages) {
    const day = dayKey(message.createdAt);
    if (day !== lastDay) {
      rows.push({ kind: 'day', key: `day-${day}`, label: formatDayLabel(message.createdAt) });
      lastDay = day;
      group = null;
    }
    if (message.type === 'system') {
      rows.push({ kind: 'system', key: message.id, message });
      group = null;
      continue;
    }
    const previous = group?.messages.at(-1);
    if (
      group &&
      previous &&
      group.senderId === message.senderId &&
      Date.parse(message.createdAt) - Date.parse(previous.createdAt) < GROUP_GAP_MS
    ) {
      group.messages.push(message);
    } else {
      group = {
        kind: 'group',
        key: `group-${message.clientId ?? message.id}`,
        senderId: message.senderId,
        mine: message.senderId === meId,
        messages: [message],
      };
      rows.push(group);
    }
  }
  return rows;
}

/** "Sent" / "Seen" under your newest message, when it is the newest in the chat. */
function getReceipt(conversation: Conversation, messages: ChatMessage[], meId: string) {
  const last = messages.at(-1);
  if (!last || last.senderId !== meId || last.status === 'failed') return null;
  if (last.status === 'sending') return { messageId: last.id, label: 'Sending', icon: ClockIcon, seen: false };

  const others = conversation.members.filter((m) => m.user.id !== meId);
  const seenBy = others.filter((m) => m.lastReadAt && m.lastReadAt >= last.createdAt).length;
  if (seenBy === 0) return { messageId: last.id, label: 'Sent', icon: CheckIcon, seen: false };
  const label =
    conversation.type === 'direct' ? 'Seen' : seenBy === others.length ? 'Seen by everyone' : `Seen by ${seenBy}`;
  return { messageId: last.id, label, icon: CheckCheckIcon, seen: true };
}

interface MessageListProps {
  conversation: Conversation;
  meId: string;
  /** The scrolling element (flex-col-reverse), used to load older messages near the top. */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onRetry: (message: ChatMessage) => void;
}

export function MessageList({ conversation, meId, scrollerRef, onRetry }: MessageListProps) {
  const { data, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useMessages(
    conversation.id,
  );
  const messages = useMemo(() => (data ? [...data.pages].reverse().flatMap((page) => page.messages) : []), [data]);
  const rows = useMemo(() => buildRows(messages, meId), [messages, meId]);
  const receipt = getReceipt(conversation, messages, meId);

  // Load older messages when the top of the list scrolls into view.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const root = scrollerRef.current;
    if (!sentinel || !root || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { root, rootMargin: '300px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [scrollerRef, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) return <MessagesSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load messages.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pt-6 pb-2 sm:px-6">
      <div ref={sentinelRef} />
      {hasNextPage ? (
        <div className="flex h-10 items-center justify-center">
          {isFetchingNextPage && <Spinner className="text-muted-foreground" />}
        </div>
      ) : (
        <ConversationIntro conversation={conversation} meId={meId} />
      )}

      <ol className="flex flex-col gap-3" aria-label="Messages">
        {rows.map((row) => {
          if (row.kind === 'day') return <DayDivider key={row.key} label={row.label} />;
          if (row.kind === 'system') {
            return (
              <li key={row.key} className="text-center text-xs text-muted-foreground">
                {row.message.body}
              </li>
            );
          }
          const sender = row.mine ? null : findMember(conversation, row.senderId);
          return (
            <MessageGroup
              key={row.key}
              messages={row.messages}
              mine={row.mine}
              sender={sender}
              showSender={conversation.type === 'group' && !row.mine}
              receipt={receipt && row.messages.some((m) => m.id === receipt.messageId) ? receipt : null}
              onRetry={onRetry}
            />
          );
        })}
      </ol>

      <TypingRow conversation={conversation} />
    </div>
  );
}

const MessageGroup = memo(function MessageGroup({
  messages,
  mine,
  sender,
  showSender,
  receipt,
  onRetry,
}: {
  messages: ChatMessage[];
  mine: boolean;
  sender: PublicUser | null;
  showSender: boolean;
  receipt: ReturnType<typeof getReceipt>;
  onRetry: (message: ChatMessage) => void;
}) {
  const last = messages.at(-1)!;
  const ReceiptIcon = receipt?.icon;

  return (
    <li className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
      {showSender && (
        <div className="mb-5 w-7 shrink-0">
          {sender && <UserAvatar user={sender} size="sm" className="size-7" />}
        </div>
      )}
      <div className={cn('flex max-w-[min(78%,36rem)] min-w-0 flex-col gap-0.5', mine ? 'items-end' : 'items-start')}>
        {showSender && (
          <span className="mb-0.5 px-3 text-xs font-medium" style={{ color: sender?.avatarColor }}>
            {sender ? sender.name : 'Deleted account'}
          </span>
        )}
        {messages.map((message, i) => (
          <Bubble
            key={message.clientId ?? message.id}
            message={message}
            mine={mine}
            first={i === 0}
            last={i === messages.length - 1}
            onRetry={onRetry}
          />
        ))}
        <div className="mt-0.5 flex items-center gap-1 px-1 text-[11px] text-muted-foreground tabular-nums">
          <time dateTime={last.createdAt}>{formatMessageTime(last.createdAt)}</time>
          {receipt && ReceiptIcon && (
            <span className={cn('flex items-center gap-0.5', receipt.seen && 'text-primary')}>
              · <ReceiptIcon className="size-3.5" /> {receipt.label}
            </span>
          )}
        </div>
      </div>
    </li>
  );
});

function Bubble({
  message,
  mine,
  first,
  last,
  onRetry,
}: {
  message: ChatMessage;
  mine: boolean;
  first: boolean;
  last: boolean;
  onRetry: (message: ChatMessage) => void;
}) {
  const failed = message.status === 'failed';
  return (
    <>
      <div
        title={formatFullDate(message.createdAt)}
        className={cn(
          'rounded-2xl px-3.5 py-2 text-[14.5px] leading-relaxed break-words whitespace-pre-wrap [overflow-wrap:anywhere]',
          mine
            ? 'bg-bubble-own text-bubble-own-foreground'
            : 'bg-bubble-other text-bubble-other-foreground shadow-xs ring-1 ring-border/70',
          // Tighter corners where bubbles in a group touch.
          mine ? cn(!first && 'rounded-tr-md', !last && 'rounded-br-md') : cn(!first && 'rounded-tl-md', !last && 'rounded-bl-md'),
          message.status === 'sending' && 'opacity-70',
          failed && 'bg-destructive/10 text-destructive ring-1 ring-destructive/30',
        )}
      >
        {message.body}
      </div>
      {failed && (
        <button
          type="button"
          onClick={() => onRetry(message)}
          className="flex items-center gap-1 px-1 text-[11px] font-medium text-destructive hover:underline"
        >
          <RotateCcwIcon className="size-3" /> Not sent. Retry
        </button>
      )}
    </>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <li className="my-2 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-border" />
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="h-px flex-1 bg-border" />
    </li>
  );
}

function ConversationIntro({ conversation, meId }: { conversation: Conversation; meId: string }) {
  const title = getConversationTitle(conversation, meId);
  return (
    <div className="mb-6 flex flex-col items-center pt-4 pb-2 text-center">
      <ConversationAvatar conversation={conversation} meId={meId} size="lg" className="size-14 text-lg" />
      <h2 className="mt-3 text-base font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {conversation.type === 'direct'
          ? `This is the beginning of your conversation with ${firstName(title)}.`
          : `This is the beginning of ${title}. ${conversation.members.length} members.`}
      </p>
    </div>
  );
}

function TypingRow({ conversation }: { conversation: Conversation }) {
  const typingIds = useTypingUserIds(conversation.id);
  const names = typingIds
    .map((id) => findMember(conversation, id))
    .filter((user) => user !== null)
    .map((user) => firstName(user.name));
  const label = typingLabel(names);

  return (
    <div className="flex h-9 items-center gap-2 pt-2" aria-live="polite">
      {label && (
        <>
          <span className="flex items-center gap-1 rounded-full bg-bubble-other px-3 py-2 shadow-xs ring-1 ring-border/70">
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
          </span>
          <span className="text-xs text-muted-foreground">{label}…</span>
        </>
      )}
    </div>
  );
}

function MessagesSkeleton() {
  const widths = ['w-48', 'w-64', 'w-40', 'w-56', 'w-36', 'w-60'];
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6" aria-busy aria-label="Loading messages">
      {widths.map((width, i) => (
        <div key={i} className={cn('flex', i % 3 === 1 ? 'justify-end' : 'justify-start')}>
          <Skeleton className={cn('h-10 rounded-2xl', width)} />
        </div>
      ))}
    </div>
  );
}
