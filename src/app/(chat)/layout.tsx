import { AuthGate } from '@/features/auth/components/auth-gate';
import { ChatShell } from '@/features/chat/components/chat-shell';
import { RealtimeLifecycle } from '@/lib/realtime/realtime-lifecycle';

// The session lives in browser memory, so the server can't prerender what's
// behind <AuthGate> (it shows a loader until the session is restored).
// Navigation inside the app is client-side and instant anyway, so tell Next's
// instant-navigation check that this segment is allowed to block.
export const instant = false;

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <RealtimeLifecycle />
      <ChatShell>{children}</ChatShell>
    </AuthGate>
  );
}
