'use client';

import { SearchIcon, SquarePenIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ConversationList } from './conversation-list';
import { NewConversationDialog } from './new-conversation-dialog';
import { UserMenu } from './user-menu';

/** Left column: brand, new chat, search, conversation list, account. */
export function Sidebar({ className }: { className?: string }) {
  const [search, setSearch] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);

  return (
    <aside className={cn('flex h-full flex-col border-r bg-sidebar text-sidebar-foreground', className)}>
      <header className="flex h-14 shrink-0 items-center justify-between px-4">
        <Logo />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="New conversation" onClick={() => setNewChatOpen(true)}>
              <SquarePenIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">New conversation</TooltipContent>
        </Tooltip>
      </header>

      <div className="px-3 pb-3">
        <InputGroup className="bg-background">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search conversations"
            aria-label="Search conversations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setSearch('')}
          />
          {search && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setSearch('')}>
                <XIcon />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      <nav aria-label="Conversations" className="flex min-h-0 flex-1 flex-col">
        <p className="px-5 pt-1 pb-1.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          Messages
        </p>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationList search={search} onNewChat={() => setNewChatOpen(true)} />
        </div>
      </nav>

      <footer className="shrink-0 border-t p-2">
        <UserMenu />
      </footer>

      <NewConversationDialog open={newChatOpen} onOpenChange={setNewChatOpen} />
    </aside>
  );
}
