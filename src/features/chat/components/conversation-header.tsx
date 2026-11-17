'use client';

import type { Conversation } from '@chat/shared';
import { ChevronLeftIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserAvatar } from '@/components/user-avatar';
import { usePresenceStore } from '@/features/presence/store';
import { firstName, formatLastSeen } from '@/lib/format';
import { useTypingUserIds } from '../stores';
import { findMember, getConversationTitle, getDirectPeer, typingLabel } from '../utils';
import { ConversationAvatar } from './conversation-avatar';

export function ConversationHeader({ conversation, meId }: { conversation: Conversation; meId: string }) {
  const peer = getDirectPeer(conversation, meId);
  const typingIds = useTypingUserIds(conversation.id);
  const onlineIds = usePresenceStore((state) => state.onlineIds);
  const liveLastSeen = usePresenceStore((state) => (peer ? state.lastSeen[peer.id] : undefined));

  const typingNames = typingIds
    .map((id) => findMember(conversation, id))
    .filter((user) => user !== null)
    .map((user) => firstName(user.name));

  let subtitle: React.ReactNode;
  if (typingNames.length > 0) {
    subtitle = (
      <span className="font-medium text-primary">
        {conversation.type === 'direct' ? 'typing…' : `${typingLabel(typingNames)}…`}
      </span>
    );
  } else if (peer) {
    subtitle = onlineIds.has(peer.id) ? (
      <span className="text-online">Online</span>
    ) : (
      formatLastSeen(liveLastSeen ?? peer.lastSeenAt)
    );
  } else {
    const online = conversation.members.filter((m) => m.user.id !== meId && onlineIds.has(m.user.id)).length;
    subtitle = `${conversation.members.length} members${online ? ` · ${online} online` : ''}`;
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3 sm:px-4">
      <Button asChild variant="ghost" size="icon" className="-ml-1 md:hidden">
        <Link href="/chat" aria-label="Back to conversations">
          <ChevronLeftIcon className="size-5" />
        </Link>
      </Button>
      <ConversationAvatar conversation={conversation} meId={meId} showPresence />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold">{getConversationTitle(conversation, meId)}</h1>
        <p className="truncate text-xs text-muted-foreground" aria-live="polite">
          {subtitle}
        </p>
      </div>
      {conversation.type === 'group' && <MembersButton conversation={conversation} meId={meId} />}
    </header>
  );
}

function MembersButton({ conversation, meId }: { conversation: Conversation; meId: string }) {
  const onlineIds = usePresenceStore((state) => state.onlineIds);
  // You first, then online people, then the rest by name.
  const members = [...conversation.members].sort(
    (a, b) =>
      Number(b.user.id === meId) - Number(a.user.id === meId) ||
      Number(onlineIds.has(b.user.id)) - Number(onlineIds.has(a.user.id)) ||
      a.user.name.localeCompare(b.user.name),
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Show members">
          <UsersIcon /> {conversation.members.length}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <p className="border-b px-4 py-3 text-sm font-semibold">Members</p>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {members.map(({ user, role }) => (
            <li key={user.id} className="flex items-center gap-3 rounded-md px-2.5 py-2">
              <UserAvatar user={user} size="sm" showPresence presenceRingClassName="ring-popover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {user.name}
                  {user.id === meId && <span className="font-normal text-muted-foreground"> (you)</span>}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {onlineIds.has(user.id) ? 'Online' : formatLastSeen(user.lastSeenAt)}
                </span>
              </span>
              {role === 'owner' && <Badge variant="secondary">Owner</Badge>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
