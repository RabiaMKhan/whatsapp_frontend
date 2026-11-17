'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { safeNextPath } from '@/lib/format';
import { bootstrapSession } from '../session';
import { useAuthStore } from '../store';

/**
 * For /login and /register. Already signed in (valid refresh cookie), or just
 * signed in with the form → go to ?next= or /chat.
 * Uses useSearchParams, so it must sit inside a <Suspense> boundary.
 */
export function GuestGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get('next'));

  useEffect(() => {
    bootstrapSession();
  }, []);

  useEffect(() => {
    if (status === 'authenticated') router.replace(next);
  }, [status, router, next]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }
  return children;
}
