'use client';

import { pickAvatarColor, type Conversation } from '@chat/shared';
import { UsersIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserAvatar } from '@/components/user-avatar';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getDirectPeer } from '../utils';

interface ConversationAvatarProps {
  conversation: Conversation;
  meId: string;
  size?: 'sm' | 'default' | 'lg';
  showPresence?: boolean;
  presenceRingClassName?: string;
  className?: string;
}

/** Direct chat → the other person's avatar. Group → a rounded square with the group's initials. */
export function ConversationAvatar({
  conversation,
  meId,
  size = 'default',
  showPresence,
  presenceRingClassName,
  className,
}: ConversationAvatarProps) {
  if (conversation.type === 'direct') {
    const peer = getDirectPeer(conversation, meId);
    if (peer) {
      return (
        <UserAvatar
          user={peer}
          size={size}
          showPresence={showPresence}
          presenceRingClassName={presenceRingClassName}
          className={className}
        />
      );
    }
  }

  return (
    <Avatar size={size} className={cn('rounded-lg after:rounded-lg', className)}>
      <AvatarFallback
        className="rounded-lg font-medium text-white"
        style={{ backgroundColor: pickAvatarColor(conversation.id) }}
      >
        {conversation.name ? initials(conversation.name) : <UsersIcon className="size-4" />}
      </AvatarFallback>
    </Avatar>
  );
}
