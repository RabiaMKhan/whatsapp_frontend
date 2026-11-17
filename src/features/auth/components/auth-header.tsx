import type { LucideIcon } from 'lucide-react';

export function AuthHeader({
  icon: Icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description: React.ReactNode;
}) {
  return (
    <div className="mb-8 space-y-1.5">
      {Icon && (
        <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground ring-1 ring-primary/10">
          <Icon className="size-5" />
        </div>
      )}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
