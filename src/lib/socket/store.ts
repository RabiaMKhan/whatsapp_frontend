import type { ClientToServerEvents, ServerToClientEvents } from '@chat/shared';
import { io, type Socket } from 'socket.io-client';
import { create } from 'zustand';
import { env } from '@/config/env';
import { refreshSession } from '@/features/auth/session';
import { useAuthStore } from '@/features/auth/store';
import { usePresenceStore } from '@/features/presence/store';

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * connecting   → first connection attempt
 * connected    → live
 * reconnecting → lost the connection; socket.io is retrying with backoff
 * offline      → stopped (signed out / left the chat area)
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

interface SocketState {
  socket: ChatSocket | null;
  status: ConnectionStatus;
}

export const useSocketStore = create<SocketState>()(() => ({
  socket: null,
  status: 'offline',
}));

const setStatus = (status: ConnectionStatus) => useSocketStore.setState({ status });

/** Open the one shared socket for this tab. Safe to call twice. */
export function startSocket(): void {
  if (useSocketStore.getState().socket) return;

  const socket: ChatSocket = io(env.socketUrl, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    // A function, not an object: it runs on every (re)connect, so the newest
    // access token is used after a refresh.
    auth: (cb) => cb({ token: useAuthStore.getState().accessToken }),
  });

  let refreshing = false;

  socket.on('connect', () => setStatus('connected'));

  socket.on('disconnect', (reason) => {
    if (reason === 'io client disconnect') return setStatus('offline');
    setStatus('reconnecting');
    // The server closed us on purpose: socket.io won't retry by itself.
    if (reason === 'io server disconnect') socket.connect();
  });

  socket.on('connect_error', async (error) => {
    if (error.message !== 'UNAUTHORIZED') {
      setStatus('reconnecting'); // server down or network issue: auto-retries
      return;
    }
    // Access token expired. Auth errors are not retried automatically, so
    // refresh the token and connect again ourselves.
    if (refreshing) return;
    refreshing = true;
    try {
      await refreshSession();
      socket.connect();
    } catch {
      setStatus('offline'); // session is gone; AuthGate redirects to /login
    } finally {
      refreshing = false;
    }
  });

  socket.on('presence:snapshot', ({ onlineUserIds }) => usePresenceStore.getState().setSnapshot(onlineUserIds));
  socket.on('presence:update', (payload) => usePresenceStore.getState().update(payload));

  useSocketStore.setState({ socket, status: 'connecting' });
  socket.connect();
}

export function stopSocket(): void {
  const { socket } = useSocketStore.getState();
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  useSocketStore.setState({ socket: null, status: 'offline' });
  usePresenceStore.getState().reset();
}
