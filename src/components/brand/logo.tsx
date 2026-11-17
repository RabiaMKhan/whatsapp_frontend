import { APP_NAME } from '@chat/shared';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-[18px]">
        <path
          d="M5 7.5A3.5 3.5 0 0 1 8.5 4h7A3.5 3.5 0 0 1 19 7.5v5a3.5 3.5 0 0 1-3.5 3.5H11l-3.6 3.1a.6.6 0 0 1-1-.45V16A3.5 3.5 0 0 1 5 12.5v-5Z"
          fill="currentColor"
        />
        <path d="M9 9.25h6M9 12h3.5" stroke="var(--primary)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">{APP_NAME}</span>
    </div>
  );
}
