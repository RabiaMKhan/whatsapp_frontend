import { create } from 'zustand';

/* ------------------------------------------------ active conversation */

/** The conversation on screen. Incoming messages there don't count as unread. */
export const useActiveConversationStore = create<{ id: string | null }>()(() => ({ id: null }));

/** True when the user is looking at this conversation right now. */
export function isViewing(conversationId: string): boolean {
  return (
    useActiveConversationStore.getState().id === conversationId &&
    typeof document !== 'undefined' &&
    document.visibilityState === 'visible'
  );
}

/* ------------------------------------------------------------- typing */

/**
 * Who is typing where. Senders repeat typing:start every few seconds, so an
 * entry expires on its own after 6 s without one (covers lost "stop" events).
 */
const TYPING_TTL_MS = 6_000;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

interface TypingState {
  byConversation: Record<string, string[]>;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
}

export const useTypingStore = create<TypingState>()((set, get) => ({
  byConversation: {},
  setTyping: (conversationId, userId, isTyping) => {
    const key = `${conversationId}:${userId}`;
    clearTimeout(timers.get(key));
    timers.delete(key);
    if (isTyping) timers.set(key, setTimeout(() => get().setTyping(conversationId, userId, false), TYPING_TTL_MS));

    set((state) => {
      const current = state.byConversation[conversationId] ?? [];
      if (current.includes(userId) === isTyping) return state;
      const next = isTyping ? [...current, userId] : current.filter((id) => id !== userId);
      return { byConversation: { ...state.byConversation, [conversationId]: next } };
    });
  },
}));

const NO_ONE: string[] = [];
export const useTypingUserIds = (conversationId: string) =>
  useTypingStore((state) => state.byConversation[conversationId] ?? NO_ONE);
