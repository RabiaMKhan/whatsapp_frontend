import { MessagesSquareIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';

export const metadata: Metadata = { title: 'Messages' };

export default function ChatHomePage() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MessagesSquareIcon />
          </EmptyMedia>
          <EmptyTitle>Select a conversation</EmptyTitle>
          <EmptyDescription>Choose a chat from the list, or start a new one to begin messaging.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
