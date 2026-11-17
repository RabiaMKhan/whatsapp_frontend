'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FullScreenLoader, ServerUnreachable } from '@/components/full-screen-state';
import { bootstrapSession, retryBootstrap } from '../session';
import { useAuthStore } from '../store';

/** Renders children only when signed in. Otherwise → /login?next=<this page>. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    bootstrapSession();
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === 'authenticated') return children;
  if (status === 'error') return <ServerUnreachable onRetry={retryBootstrap} />;
  return <FullScreenLoader label="Loading your workspace…" />;
}
