import { Suspense } from 'react';
import { ConversationRoute, ConversationSkeleton } from '@/features/chat/components/conversation-view';

export default function ConversationPage({ params }: PageProps<'/chat/[conversationId]'>) {
  // params is a Promise (Next 16). The client component unwraps it with use(),
  // so this Suspense boundary shows the skeleton until it resolves.
  return (
    <Suspense fallback={<ConversationSkeleton />}>
      <ConversationRoute params={params} />
    </Suspense>
  );
}
