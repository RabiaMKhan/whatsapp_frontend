import { CheckCheckIcon, RadioIcon, ShieldCheckIcon } from 'lucide-react';

const FEATURES = [
  { icon: RadioIcon, title: 'Real-time by default', text: 'Messages, typing and presence arrive the moment they happen.' },
  { icon: CheckCheckIcon, title: 'Know what was read', text: 'Read receipts and unread counts stay in sync on every device.' },
  { icon: ShieldCheckIcon, title: 'Secure sessions', text: 'Short-lived tokens with rotating, httpOnly refresh cookies.' },
];

/** Static product panel on the right of the auth pages (desktop only). */
export function BrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-[oklch(0.22_0.05_267)] text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      {/* Soft grid + glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 size-[480px] rounded-full bg-[oklch(0.55_0.2_267)] opacity-40 blur-[120px]"
      />

      <div className="relative max-w-md">
        <p className="text-sm font-medium text-white/60">Team messaging</p>
        <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">
          Conversations that keep your team in sync.
        </h2>
      </div>

      <MockConversation />

      <ul className="relative grid gap-5">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
              <Icon className="size-4" />
            </span>
            <span>
              <span className="block text-sm font-medium">{title}</span>
              <span className="block text-sm text-white/60">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MockConversation() {
  return (
    <div className="relative my-10 max-w-md rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-[#0F8F7E] text-xs font-medium">PT</span>
        <span>
          <span className="block text-sm font-medium">Product Team</span>
          <span className="block text-xs text-white/50">5 members · 3 online</span>
        </span>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-end gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#BE3B5F] text-[10px] font-medium">SA</span>
          <p className="max-w-[80%] rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2">Release is scheduled for Thursday, 10am UK time.</p>
        </div>
        <div className="flex justify-end">
          <p className="max-w-[80%] rounded-2xl rounded-br-md bg-[oklch(0.55_0.18_267)] px-3.5 py-2">
            Perfect. Release notes are in the shared folder.
          </p>
        </div>
        <div className="flex items-center gap-2 pl-8 text-xs text-white/50">
          <span className="flex gap-0.5">
            <span className="size-1 animate-bounce rounded-full bg-white/60 [animation-delay:-0.3s]" />
            <span className="size-1 animate-bounce rounded-full bg-white/60 [animation-delay:-0.15s]" />
            <span className="size-1 animate-bounce rounded-full bg-white/60" />
          </span>
          Daniel is typing…
        </div>
      </div>
    </div>
  );
}
