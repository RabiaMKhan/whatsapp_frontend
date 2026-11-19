'use client';

import { APP_NAME, createInviteSchema, type Invite, type PublicUser } from '@chat/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNowStrict } from 'date-fns';
import { MailIcon, MessageSquareIcon, SendIcon, TerminalIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { UserAvatar } from '@/components/user-avatar';
import { FormAlert } from '@/features/auth/components/form-alert';
import { useCreateConversation } from '@/features/chat/hooks';
import { getErrorMessage } from '@/lib/api/http';
import { useInvites, useSendInvite } from '../hooks';

/**
 * Invite someone by email. If they already have an account, offer to start a
 * chat instead. Below the form: invites sent so far and whether they joined.
 */
export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Remount on every open, so the form starts empty and the list refetches. */}
        {open && <InviteForm onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const send = useSendInvite();
  const createChat = useCreateConversation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [member, setMember] = useState<PublicUser | null>(null);

  const form = useForm({
    resolver: zodResolver(createInviteSchema),
    defaultValues: { email: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email }) => {
    setServerError(null);
    setMember(null);
    try {
      const result = await send.mutateAsync({ email });
      if (result.status === 'already_member') {
        setMember(result.user);
        return;
      }
      toast.success(`Invite sent to ${result.invite.email}`);
      form.reset();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  async function startChat(user: PublicUser) {
    try {
      const { conversation } = await createChat.mutateAsync({ type: 'direct', userId: user.id });
      onDone();
      router.push(`/chat/${conversation.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <DialogHeader className="px-5 pt-5 pb-4">
        <DialogTitle>Invite people</DialogTitle>
        <DialogDescription>
          We&apos;ll email them a link to join {APP_NAME}. When they sign up, a chat with you will be waiting.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={onSubmit} noValidate className="space-y-3 px-5 pb-5">
        <FormAlert message={serverError} />
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="invite-email" className="sr-only">
            Email address
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              autoFocus
              placeholder="colleague@company.com"
              aria-invalid={!!errors.email}
              {...form.register('email', { onChange: () => setMember(null) })}
            />
            <Button type="submit" disabled={isSubmitting} className="shrink-0">
              {isSubmitting ? <Spinner /> : <SendIcon />}
              Send invite
            </Button>
          </div>
          <FieldError errors={[errors.email]} />
        </Field>

        {member && (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            <UserAvatar user={member} showPresence presenceRingClassName="ring-muted" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{member.name} is already on {APP_NAME}</p>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => startChat(member)} disabled={createChat.isPending}>
              {createChat.isPending ? <Spinner /> : <MessageSquareIcon />}
              Chat
            </Button>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && (
          <p className="flex gap-2 text-xs text-muted-foreground">
            <TerminalIcon className="mt-0.5 size-3.5 shrink-0" />
            Development: without SMTP, the invite email is printed in the API server console.
          </p>
        )}
      </form>

      <SentInvites />
    </>
  );
}

function SentInvites() {
  const invites = useInvites();

  if (invites.isPending) {
    return (
      <div className="space-y-2 border-t px-5 py-4">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }
  if (!invites.data?.length) return null;

  return (
    <section aria-labelledby="sent-invites" className="border-t bg-muted/30">
      <h3 id="sent-invites" className="px-5 pt-3 pb-1 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        Sent invites
      </h3>
      <ul className="max-h-56 overflow-y-auto px-2 pb-2">
        {invites.data.map((invite) => (
          <InviteRow key={invite.id} invite={invite} />
        ))}
      </ul>
    </section>
  );
}

function InviteRow({ invite }: { invite: Invite }) {
  const joined = invite.status === 'joined';
  const when = formatDistanceToNowStrict(new Date(joined && invite.joinedAt ? invite.joinedAt : invite.lastSentAt), {
    addSuffix: true,
  });
  return (
    <li className="flex items-center gap-3 rounded-md px-3 py-2">
      <MailIcon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{invite.email}</p>
        <p className="text-xs text-muted-foreground">{joined ? `Joined ${when}` : `Sent ${when}`}</p>
      </div>
      <Badge variant={joined ? 'default' : 'secondary'}>{joined ? 'Joined' : 'Pending'}</Badge>
    </li>
  );
}
