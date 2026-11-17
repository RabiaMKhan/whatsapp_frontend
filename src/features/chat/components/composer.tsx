'use client';

import { LIMITS } from '@chat/shared';
import { ArrowUpIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { useTypingEmitter } from '../actions';

interface ComposerProps {
  conversationId: string;
  placeholder: string;
  onSend: (body: string) => void;
}

/** Enter sends, Shift+Enter adds a line. Grows with the text up to ~8 lines. */
export function Composer({ conversationId, placeholder, onSend }: ComposerProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typing = useTypingEmitter(conversationId);

  // Focus the box when a chat opens (desktop only: on phones it would pop the keyboard).
  useEffect(() => {
    if (window.matchMedia('(min-width: 768px)').matches) textareaRef.current?.focus();
  }, [conversationId]);

  function submit() {
    const body = text.trim();
    if (!body) return;
    onSend(body);
    setText('');
    typing.stop();
    textareaRef.current?.focus();
  }

  return (
    <div className="shrink-0 border-t bg-background px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
      <form
        className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-card py-1.5 pr-1.5 pl-4 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/25"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          maxLength={LIMITS.MESSAGE_MAX}
          placeholder={placeholder}
          aria-label="Message"
          onChange={(event) => {
            setText(event.target.value);
            if (event.target.value.trim()) typing.ping();
            else typing.stop();
          }}
          onKeyDown={(event) => {
            // isComposing: don't send while an IME (e.g. Urdu/Chinese input) is mid-word.
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
          onBlur={typing.stop}
          className="field-sizing-content max-h-40 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-[14.5px] leading-relaxed outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="icon" className="mb-px shrink-0 rounded-full" disabled={!text.trim()} aria-label="Send message">
          <ArrowUpIcon />
        </Button>
      </form>
      <p className="mx-auto mt-1.5 hidden max-w-3xl px-1 text-[11px] text-muted-foreground sm:block">
        <Kbd>Enter</Kbd> to send · <Kbd>Shift</Kbd> + <Kbd>Enter</Kbd> for a new line
      </p>
    </div>
  );
}
