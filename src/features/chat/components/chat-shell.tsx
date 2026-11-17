'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChatRealtime } from '../realtime';
import { Sidebar } from './sidebar';

/**
 * Two-column app frame. Desktop: sidebar + conversation side by side.
 * Mobile: one at a time (list on /chat, conversation on /chat/[id]).
 */
export function ChatShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inConversation = pathname !== '/chat';

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <ChatRealtime />
      <Sidebar className={cn('w-full shrink-0 md:flex md:w-80 lg:w-[340px]', inConversation ? 'hidden' : 'flex')} />
      <main className={cn('min-w-0 flex-1 flex-col bg-canvas md:flex', inConversation ? 'flex' : 'hidden')}>
        {children}
      </main>
    </div>
  );
}
