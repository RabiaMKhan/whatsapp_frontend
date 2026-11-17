'use client';

import { LIMITS, type Conversation } from '@chat/shared';
import { MessageSquarePlusIcon, RefreshCwIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/store';
import { formatListTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useConversations } from '../hooks';
import { useTypingUserIds } from '../stores';
import { activityTime, getConversationTitle, getPreview } from '../utils';
import { ConversationAvatar } from './conversation-avatar';

export function ConversationList({ search, onNewChat }: { search: string; onNewChat: () => void }) {
  const me = useCurrentUser();
  const pathname = usePathname();
  const activeId = pathname.startsWith('/chat/') ? pathname.split('/')[2] : null;
  const { data, isPending, isError, refetch, isRefetching } = useConversations();

  if (isPending) return <ListSkeleton />;

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">Couldn&apos;t load your conversations.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCwIcon className={cn(isRefetching && 'animate-spin')} /> Try again
        </Button>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-8 py-14 text-center">
        <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <MessageSquarePlusIcon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Start a chat with a teammate or create a group.</p>
        </div>
        <Button size="sm" onClick={onNewChat}>
          New conversation
        </Button>
      </div>
    );
  }

  const query = search.trim().toLowerCase();
  const visible = query
    ? data.filter(
        (c) =>
          getConversationTitle(c, me.id).toLowerCase().includes(query) ||
          c.members.some((m) => m.user.id !== me.id && m.user.name.toLowerCase().includes(query)),
      )
    : data;

  if (visible.length === 0) {
    return <p className="px-5 py-10 text-center text-sm text-muted-foreground">No conversations match “{search}”.</p>;
  }

  return (
    <ul className="space-y-0.5 px-2 pb-2">
      {visible.map((conversation) => (
        <li key={conversation.id}>
          <ConversationRow conversation={conversation} meId={me.id} active={conversation.id === activeId} />
        </li>
      ))}
    </ul>
  );
}

const ConversationRow = memo(function ConversationRow({
  conversation,
  meId,
  active,
}: {
  conversation: Conversation;
  meId: string;
  active: boolean;
}) {
  const typing = useTypingUserIds(conversation.id).length > 0;
  const unread = conversation.unreadCount;
  const preview = getPreview(conversation, meId);

  return (
    <Link
      href={`/chat/${conversation.id}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-2.5 py-2.5 outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50',
        active && 'bg-sidebar-accent',
      )}
    >
      <ConversationAvatar
        conversation={conversation}
        meId={meId}
        size="lg"
        showPresence
        presenceRingClassName={cn('ring-sidebar group-hover:ring-sidebar-accent', active && 'ring-sidebar-accent')}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={cn('truncate text-sm', unread ? 'font-semibold' : 'font-medium')}>
            {getConversationTitle(conversation, meId)}
          </span>
          <span className={cn('shrink-0 text-[11px] tabular-nums', unread ? 'font-medium text-primary' : 'text-muted-foreground')}>
            {formatListTime(activityTime(conversation))}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className={cn('truncate text-[13px]', unread ? 'text-foreground' : 'text-muted-foreground')}>
            {typing ? <span className="font-medium text-primary">typing…</span> : (preview ?? 'No messages yet')}
          </span>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
              {unread >= LIMITS.UNREAD_CAP ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

function ListSkeleton() {
  return (
    <div className="space-y-1 px-2" aria-busy aria-label="Loading conversations">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2.5 py-2.5">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
