import { APP_NAME } from '@chat/shared';
import { Suspense } from 'react';
import { Logo } from '@/components/brand/logo';
import { Spinner } from '@/components/ui/spinner';
import { GuestGate } from '@/features/auth/components/guest-gate';
import { BrandPanel } from './brand-panel';

// <GuestGate> checks the session in the browser before showing the form,
// so the server can't prerender the page content (see (chat)/layout.tsx).
export const instant = false;

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[360px]">
            {/* GuestGate reads ?next= with useSearchParams, which needs Suspense. */}
            <Suspense
              fallback={
                <div className="flex justify-center py-24">
                  <Spinner className="size-5 text-muted-foreground" />
                </div>
              }
            >
              <GuestGate>{children}</GuestGate>
            </Suspense>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 {APP_NAME}. Real-time messaging with Ably.
        </p>
      </div>
      <BrandPanel />
    </div>
  );
}
