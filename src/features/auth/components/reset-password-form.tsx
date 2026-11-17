'use client';

import { LIMITS, resetPasswordSchema } from '@chat/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/api/http';
import { clearPending, cooldownLeft, readPending, savePending } from '../pending';
import { forgotPassword, resetPassword } from '../session';
import { CodeInput } from './code-input';
import { DevEmailHint } from './dev-email-hint';
import { FormAlert } from './form-alert';
import { PasswordInput } from './password-input';
import { ResendCode } from './resend-code';

// Same rules as the API, plus a confirm field that only the form needs.
const formSchema = resetPasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export function ResetPasswordForm() {
  const router = useRouter();
  const [pending] = useState(() => readPending('reset'));
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: { email: pending?.email ?? '', code: '', password: '', confirmPassword: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async ({ email, code, password }) => {
    setServerError(null);
    try {
      const { message } = await resetPassword({ email, code, password });
      clearPending();
      toast.success(message);
      router.replace('/login');
    } catch (error) {
      setServerError(getErrorMessage(error));
      form.setValue('code', '');
    }
  });

  async function resend() {
    const email = form.getValues('email');
    const parsed = resetPasswordSchema.shape.email.safeParse(email);
    if (!parsed.success) throw new Error('Enter your email address first');
    await forgotPassword({ email: parsed.data });
    savePending(parsed.data, 'reset');
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FieldGroup className="gap-5">
        <FormAlert message={serverError} />

        {!pending && (
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
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
        )}

        <Field data-invalid={!!errors.code}>
          <FieldLabel htmlFor="code">Reset code</FieldLabel>
          <Controller
            control={form.control}
            name="code"
            render={({ field }) => (
              <CodeInput
                id="code"
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.code}
                disabled={isSubmitting}
                autoFocus={!!pending}
              />
            )}
          />
          <FieldError errors={[errors.code]} />
        </Field>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Choose a new password"
            aria-invalid={!!errors.password}
            {...form.register('password')}
          />
          {errors.password ? (
            <FieldError errors={[errors.password]} />
          ) : (
            <FieldDescription>At least {LIMITS.PASSWORD_MIN} characters.</FieldDescription>
          )}
        </Field>

        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Type it again"
            aria-invalid={!!errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Updating password…' : 'Update password'}
        </Button>

        <ResendCode initialCooldown={cooldownLeft(pending?.sentAt)} onResend={resend} disabled={isSubmitting} />
        <DevEmailHint />

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
