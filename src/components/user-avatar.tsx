'use client';

import type { PublicUser } from '@chat/shared';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useIsOnline } from '@/features/presence/store';
import { initials } from '@/lib/format';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user: Pick<PublicUser, 'id' | 'name' | 'avatarColor'>;
  size?: 'sm' | 'default' | 'lg';
  /** Show the green online dot. */
  showPresence?: boolean;
  /** Ring around the dot; match it to the surface behind the avatar. */
  presenceRingClassName?: string;
  className?: string;
}

export function UserAvatar({
  user,
  size = 'default',
  showPresence = false,
  presenceRingClassName = 'ring-background',
  className,
}: UserAvatarProps) {
  const online = useIsOnline(user.id);

  return (
    <div className="relative inline-flex shrink-0">
      <Avatar size={size} className={className}>
        <AvatarFallback className="font-medium text-white" style={{ backgroundColor: user.avatarColor }}>
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      {showPresence && online && (
        <span
          aria-label="Online"
          className={cn(
            'absolute right-0 bottom-0 size-2.5 rounded-full bg-online ring-2',
            size === 'lg' && 'size-3',
            presenceRingClassName,
          )}
        />
      )}
    </div>
  );
}
