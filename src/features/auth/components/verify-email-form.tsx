'use client';

import { verifyEmailSchema } from '@chat/shared';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { getErrorMessage } from '@/lib/api/http';
import { clearPending, cooldownLeft, readPending, savePending } from '../pending';
import { resendVerification, verifyEmail } from '../session';
import { CodeInput } from './code-input';
import { DevEmailHint } from './dev-email-hint';
import { FormAlert } from './form-alert';
import { ResendCode } from './resend-code';

/** Enter the 6-digit code. On success the user is signed in and <GuestGate> redirects. */
export function VerifyEmailForm() {
  // This form mounts only in the browser (behind GuestGate), so reading storage here is safe.
  const [pending] = useState(() => readPending('verify'));
  const [email, setEmail] = useState(pending?.email ?? '');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(value = code) {
    const parsed = verifyEmailSchema.safeParse({ email, code: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the code and try again');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await verifyEmail(parsed.data);
      clearPending();
      toast.success('Email verified. Welcome aboard!');
    } catch (err) {
      setError(getErrorMessage(err));
      setCode('');
      setSubmitting(false);
    }
  }

  async function resend() {
    const parsed = verifyEmailSchema.shape.email.safeParse(email);
    if (!parsed.success) throw new Error('Enter your email address first');
    await resendVerification({ email: parsed.data });
    savePending(parsed.data, 'verify');
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <FieldGroup className="gap-5">
        <FormAlert message={error} />

        {!pending && (
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              className="h-9"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        )}

        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="code">Verification code</FieldLabel>
          <CodeInput
            id="code"
            value={code}
            onChange={(value) => {
              setCode(value);
              if (error) setError(null);
            }}
            onComplete={(value) => void submit(value)}
            invalid={!!error}
            disabled={submitting}
            autoFocus={!!pending}
          />
          <FieldError />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={submitting || code.length < 6}>
          {submitting && <Spinner />}
          {submitting ? 'Verifying…' : 'Verify email'}
        </Button>

        <ResendCode initialCooldown={cooldownLeft(pending?.sentAt)} onResend={resend} disabled={submitting} />
        <DevEmailHint />

        <p className="text-center text-sm text-muted-foreground">
          Wrong email?{' '}
          <Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
            Sign up again
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}

/**
 * The "We sent a code to x@y.com" line. Safe to read storage while rendering:
 * auth pages render only in the browser, after <GuestGate> has checked the session.
 */
export function PendingEmailText({ flow, fallback }: { flow: 'verify' | 'reset'; fallback: string }) {
  const [pending] = useState(() => readPending(flow));
  if (!pending) return <>{fallback}</>;
  return (
    <>
      We sent a 6-digit code to <span className="font-medium text-foreground">{pending.email}</span>. It expires in 10
      minutes.
    </>
  );
}
