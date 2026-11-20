'use client';

import { useConnectionStatus } from '@/lib/realtime/hooks';
import type { ConnectionStatus as Status } from '@/lib/realtime/store';
import { cn } from '@/lib/utils';

const STATUS: Record<Status, { label: string; dot: string }> = {
  connected: { label: 'Online', dot: 'bg-online' },
  connecting: { label: 'Connecting…', dot: 'bg-away animate-pulse' },
  reconnecting: { label: 'Reconnecting…', dot: 'bg-away animate-pulse' },
  offline: { label: 'Offline', dot: 'bg-muted-foreground/50' },
};

export function ConnectionStatus({ className }: { className?: string }) {
  const status = useConnectionStatus();
  const { label, dot } = STATUS[status];

  return (
    <span
      role="status"
      aria-live="polite"
      data-status={status}
      className={cn('flex items-center gap-1.5 text-xs text-muted-foreground', className)}
    >
      <span className={cn('size-1.5 rounded-full', dot)} />
      {label}
    </span>
  );
}
