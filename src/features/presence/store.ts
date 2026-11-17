import type { PresencePayload } from '@chat/shared';
import { create } from 'zustand';

interface PresenceState {
  onlineIds: ReadonlySet<string>;
  /** Fresher than PublicUser.lastSeenAt: updated live when someone goes offline. */
  lastSeen: Record<string, string>;
  setSnapshot: (ids: string[]) => void;
  update: (payload: PresencePayload) => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>()((set) => ({
  onlineIds: new Set(),
  lastSeen: {},
  setSnapshot: (ids) => set({ onlineIds: new Set(ids) }),
  update: ({ userId, online, lastSeenAt }) =>
    set((state) => {
      const onlineIds = new Set(state.onlineIds);
      if (online) onlineIds.add(userId);
      else onlineIds.delete(userId);
      return {
        onlineIds,
        lastSeen: lastSeenAt ? { ...state.lastSeen, [userId]: lastSeenAt } : state.lastSeen,
      };
    }),
  reset: () => set({ onlineIds: new Set(), lastSeen: {} }),
}));

export const useIsOnline = (userId: string) => usePresenceStore((state) => state.onlineIds.has(userId));
