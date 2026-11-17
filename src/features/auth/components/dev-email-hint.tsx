import { TerminalIcon } from 'lucide-react';

/** Development only: without SMTP the API prints emails in its console. */
export function DevEmailHint() {
  if (process.env.NODE_ENV !== 'development') return null;
  return (
    <div className="flex gap-2.5 rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
      <TerminalIcon className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Development: if SMTP isn&apos;t configured, the email (with the code) is printed in the API server console.
      </span>
    </div>
  );
}
