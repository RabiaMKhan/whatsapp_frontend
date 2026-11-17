'use client';

import { AUTH_CODE } from '@chat/shared';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { toApiError } from '@/lib/api/http';

/** Seconds counting down to 0, one tick per second. */
function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);
  return [secondsLeft, setSecondsLeft] as const;
}

interface ResendCodeProps {
  /** Seconds left from a code sent on the previous page. */
  initialCooldown: number;
  /** Ask the API for a new code. */
  onResend: () => Promise<unknown>;
  disabled?: boolean;
}

/** "Didn't get it? Resend code (0:42)" */
export function ResendCode({ initialCooldown, onResend, disabled }: ResendCodeProps) {
  const [secondsLeft, setSecondsLeft] = useCountdown(initialCooldown);
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await onResend();
      setSecondsLeft(AUTH_CODE.RESEND_COOLDOWN_SECONDS);
      toast.success('New code sent. Check your inbox.');
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.retryAfterSeconds) setSecondsLeft(apiError.retryAfterSeconds);
      toast.error(apiError.message);
    } finally {
      setSending(false);
    }
  }

  const waiting = secondsLeft > 0;
  const clock = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <p className="text-center text-sm text-muted-foreground">
      Didn&apos;t get the code?{' '}
      <Button
        type="button"
        variant="link"
        className="h-auto p-0 font-medium"
        disabled={disabled || waiting || sending}
        onClick={resend}
      >
        {sending ? 'Sending…' : waiting ? `Resend in ${clock}` : 'Resend code'}
      </Button>
    </p>
  );
}
