'use client';

import { APP_NAME, emailSchema, LIMITS, registerSchema } from '@chat/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheckIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/api/http';
import { savePending } from '../pending';
import { register } from '../session';
import { FormAlert } from './form-alert';
import { PasswordInput } from './password-input';

/** Uses useSearchParams: the (auth) layout provides the Suspense boundary. */
export function RegisterForm() {
  const router = useRouter();
  // Invite links open /register?email=… so the invited address is filled in.
  const invited = emailSchema.safeParse(useSearchParams().get('email') ?? '');
  const invitedEmail = invited.success ? invited.data : null;
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: invitedEmail ?? '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const { email } = await register(values);
      savePending(email, 'verify');
      router.push('/verify-email');
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        <FormAlert message={serverError} />

        {invitedEmail && (
          <div className="flex gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
            <MailCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="text-muted-foreground">
              You were invited to {APP_NAME}. Sign up with this email and the person who invited you will be in your
              chats.
            </span>
          </div>
        )}

        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jane Cooper"
            className="h-9"
            aria-invalid={!!errors.name}
            {...form.register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-9"
            aria-invalid={!!errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <FieldDescription>At least {LIMITS.PASSWORD_MIN} characters.</FieldDescription>
          )}
        </Field>

        <Button type="submit" size="lg" className="mt-1 w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </FieldGroup>
    </form>
  );
}
