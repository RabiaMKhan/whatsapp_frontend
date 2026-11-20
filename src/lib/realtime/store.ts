import { REALTIME, userChannel } from '@chat/shared';
// @ably/pubsub-device (not the old `ably` package): Ably accounts on MAU pricing reject
// the old SDK. A device connection must carry a clientId, which our tokens do.
import {
  createClient,
  type PresenceMessage,
  type PubSubClient,
  type RealtimeChannel,
  type TokenRequest,
} from '@ably/pubsub-device';
import { create } from 'zustand';
import { api } from '@/lib/api/client';
import { toApiError } from '@/lib/api/http';
import { usePresenceStore } from '@/features/presence/store';

/**
 * connecting   → first connection attempt
 * connected    → live
 * reconnecting → lost the connection; Ably is retrying with backoff
 * offline      → stopped (signed out / left the chat area) or failed
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline';

interface RealtimeState {
  client: PubSubClient | null;
  /** My private channel: the API publishes every event I need here. */
  channel: RealtimeChannel | null;
  status: ConnectionStatus;
}

export const useRealtimeStore = create<RealtimeState>()(() => ({
  client: null,
  channel: null,
  status: 'offline',
}));

const setStatus = (status: ConnectionStatus) => useRealtimeStore.setState({ status });

let heartbeat: ReturnType<typeof setInterval> | undefined;

/** Tell the API "still here" so other people's "last seen" stays right. */
function sendHeartbeat() {
  if (document.visibilityState !== 'visible') return;
  api.post('/users/me/heartbeat').catch(() => {});
}

/**
 * Connect this tab to Ably as `userId`. Safe to call twice.
 *
 * Auth: Ably calls authCallback whenever it needs a token (first connect and
 * before expiry). We ask our API, which signs a TokenRequest with the secret
 * key; the browser never sees the key. The api client adds the access token
 * and refreshes it on a 401, so this keeps working across sessions.
 */
export function startRealtime(userId: string): void {
  if (useRealtimeStore.getState().client) return;

  const client = createClient({
    authCallback: async (_params, callback) => {
      try {
        const { data } = await api.post<TokenRequest>('/realtime/token');
        callback(null, data);
      } catch (error) {
        const apiError = toApiError(error);
        callback(apiError.message, null);
        // 503: the API has no Ably key (local development). Stop retrying;
        // everything else still works, just without live updates.
        if (apiError.status === 503) client.close();
      }
    },
  });

  let everConnected = false;
  client.connection.on((change) => {
    switch (change.current) {
      case 'connected':
        everConnected = true;
        return setStatus('connected');
      case 'connecting':
        return setStatus(everConnected ? 'reconnecting' : 'connecting');
      case 'disconnected':
      case 'suspended':
        return setStatus('reconnecting');
      case 'closing':
      case 'closed':
      case 'failed':
        return setStatus('offline');
    }
  });

  const channel = client.channels.get(userChannel(userId));
  void channel.attach().catch(() => {}); // listeners subscribe as components mount

  trackPresence(client);

  sendHeartbeat();
  heartbeat = setInterval(sendHeartbeat, REALTIME.HEARTBEAT_SECONDS * 1000);

  useRealtimeStore.setState({ client, channel, status: 'connecting' });
}

/**
 * Online status: every tab enters presence on one shared channel. Ably stamps
 * each member with the clientId from our token, so nobody can appear as
 * someone else. A user with two tabs is online until the last one leaves.
 */
function trackPresence(client: PubSubClient) {
  const online = client.channels.get(REALTIME.ONLINE_CHANNEL);
  const { setSnapshot, update } = usePresenceStore.getState();

  const sync = async (changed?: PresenceMessage) => {
    const members = await online.presence.get();
    const ids = [...new Set(members.map((member) => member.clientId))];
    setSnapshot(ids);
    if (changed?.action === 'leave' && !ids.includes(changed.clientId)) {
      update({ userId: changed.clientId, online: false, lastSeenAt: new Date(changed.timestamp).toISOString() });
    }
  };

  // Only once connected: entering while the client is closing throws inside Ably.
  client.connection.once('connected', () => {
    void online.presence.subscribe((message) => void sync(message).catch(() => {})).catch(() => {});
    void online.presence.enter().then(() => sync()).catch(() => {});
  });
}

export function stopRealtime(): void {
  const { client } = useRealtimeStore.getState();
  if (!client) return;
  clearInterval(heartbeat);
  client.close(); // leaves presence: others see us go offline
  useRealtimeStore.setState({ client: null, channel: null, status: 'offline' });
  usePresenceStore.getState().reset();
}
