import { WifiOffIcon } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export function FullScreenLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background">
      <LogoMark className="size-10 rounded-xl" />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        {label}
      </div>
    </div>
  );
}

export function ServerUnreachable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <WifiOffIcon className="size-5" />
        </div>
        <h1 className="text-base font-semibold">Can&apos;t reach the server</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Check your internet connection. If it&apos;s fine, the service may be restarting. Try again in a moment.
        </p>
        <Button className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
