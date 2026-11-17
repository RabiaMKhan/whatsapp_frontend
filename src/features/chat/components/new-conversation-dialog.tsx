'use client';

import { LIMITS, type PublicUser } from '@chat/shared';
import { CheckIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { UserAvatar } from '@/components/user-avatar';
import { getErrorMessage } from '@/lib/api/http';
import { firstName } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useCreateConversation, useDebouncedValue, useUserSearch } from '../hooks';

/**
 * Pick one person → direct chat (reuses the existing one if there is one).
 * Pick two or more → name the group and create it.
 */
export function NewConversationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Remount on every open, so the form always starts empty. */}
        {open && <NewConversationForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function NewConversationForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PublicUser[]>([]);
  const [groupName, setGroupName] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const users = useUserSearch(debouncedSearch);
  const create = useCreateConversation();

  const isGroup = selected.length >= 2;
  const canSubmit = selected.length > 0 && (!isGroup || groupName.trim().length > 0) && !create.isPending;

  const toggle = (user: PublicUser) =>
    setSelected((current) =>
      current.some((u) => u.id === user.id)
        ? current.filter((u) => u.id !== user.id)
        : current.length > LIMITS.GROUP_MEMBERS_MAX - 1
          ? current
          : [...current, user],
    );

  async function submit() {
    if (!canSubmit) return;
    try {
      const { conversation } = await create.mutateAsync(
        isGroup
          ? { type: 'group', name: groupName.trim(), memberIds: selected.map((u) => u.id) }
          : { type: 'direct', userId: selected[0]!.id },
      );
      onDone();
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <DialogHeader className="px-5 pt-5 pb-3">
        <DialogTitle>New conversation</DialogTitle>
        <DialogDescription>Message one person, or pick several people to start a group.</DialogDescription>
      </DialogHeader>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-5 pb-3">
          {selected.map((user) => (
            <span
              key={user.id}
              className="flex items-center gap-1.5 rounded-full bg-accent py-0.5 pr-1 pl-0.5 text-xs font-medium text-accent-foreground"
            >
              <UserAvatar user={user} size="sm" className="size-5" />
              {firstName(user.name)}
              <button
                type="button"
                onClick={() => toggle(user)}
                aria-label={`Remove ${user.name}`}
                className="rounded-full p-0.5 hover:bg-primary/10"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Command shouldFilter={false} className="rounded-none border-t bg-transparent">
        <CommandInput placeholder="Search people by name or email" value={search} onValueChange={setSearch} autoFocus />
        <CommandList className="max-h-72">
          {users.isPending ? (
            <div className="flex justify-center py-8">
              <Spinner className="text-muted-foreground" />
            </div>
          ) : (
            <>
              <CommandEmpty>{debouncedSearch ? 'No one matches that search.' : 'No other people yet.'}</CommandEmpty>
              <CommandGroup heading={debouncedSearch ? 'Results' : 'People'}>
                {users.data?.map((user) => {
                  const isSelected = selected.some((u) => u.id === user.id);
                  return (
                    <CommandItem
                      key={user.id}
                      value={user.id}
                      onSelect={() => toggle(user)}
                      className="gap-3 py-2"
                      aria-label={`${isSelected ? 'Remove' : 'Add'} ${user.name}`}
                    >
                      <UserAvatar user={user} showPresence presenceRingClassName="ring-popover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{user.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                      </span>
                      <span
                        className={cn(
                          'flex size-5 items-center justify-center rounded-full border',
                          isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                        )}
                      >
                        {isSelected && <CheckIcon className="size-3" />}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </Command>

      {isGroup && (
        <div className="border-t px-5 py-3">
          <Input
            placeholder="Group name, e.g. Product Team"
            value={groupName}
            maxLength={LIMITS.GROUP_NAME_MAX}
            onChange={(e) => setGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void submit()}
            aria-label="Group name"
          />
        </div>
      )}

      {/* m-0: the shadcn footer pulls itself out with negative margins meant for a padded dialog. */}
      <DialogFooter className="m-0 border-t bg-muted/40 px-5 py-3 sm:justify-between">
        <span className="hidden self-center text-xs text-muted-foreground sm:block">
          {selected.length === 0 ? 'Select people' : `${selected.length} selected`}
        </span>
        <Button onClick={submit} disabled={!canSubmit}>
          {create.isPending && <Spinner />}
          {isGroup ? 'Create group' : 'Start chat'}
        </Button>
      </DialogFooter>
    </>
  );
}
