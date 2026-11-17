# WhatsApp Frontend: Relay chat web app

Web app for the Relay real-time chat: **Next.js 16 (App Router) + Tailwind v4 + shadcn/ui + socket.io-client**. It needs the API from [whatsapp_backend](https://github.com/RabiaMKhan/whatsapp_backend) running.

## Stack

Next.js 16 (Cache Components), React 19, Tailwind v4, shadcn/ui (Radix, Nova preset), TanStack Query, Zustand, React Hook Form + Zod, socket.io-client, date-fns.

## Project structure

```
src/
  app/(auth)/        /login, /register, /verify-email, /forgot-password, /reset-password
  app/(chat)/        /chat and /chat/[conversationId] (AuthGate + socket + app shell)
  features/auth/     session, auth store, forms, code input, guards
  features/chat/     queries, cache updates, realtime bridge, send/typing/read actions, UI
  features/presence/ who is online
  lib/api/           axios client (auto refresh on 401)
  lib/socket/        socket store, lifecycle, useSocketEvent hook
  components/ui/     shadcn components
packages/shared/     types + Zod schemas shared with the backend
```

## Getting started

Start [whatsapp_backend](https://github.com/RabiaMKhan/whatsapp_backend) first (port 4000), then:

```bash
npm install
```

```bash
cp .env.example .env.local
```

```bash
npm run dev               # http://localhost:3005
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3005 |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run typecheck` | Generate Next route types, then `tsc` |
| `npm run lint` | ESLint |

## Environment variables

`.env.local` (copy from `.env.example`): `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`), optional `NEXT_PUBLIC_SOCKET_URL`. These are public (sent to the browser), so never put secrets here.

## Auth pages

`/register` → `/verify-email` (6-box code input, auto-submits, resend countdown) · `/login` (unverified accounts are sent to `/verify-email`) · `/forgot-password` → `/reset-password`. The access token lives only in memory; the httpOnly refresh cookie restores the session on reload. The email waiting for a code is kept in `sessionStorage`, never in the URL.

## Chat UI

| Part | Behaviour |
| --- | --- |
| Conversation list | Search, unread badges (99+), "You:" / sender previews, relative times, live "typing…", presence dots, newest first |
| New conversation | Search people; one person → direct chat (reuses an existing one), 2+ → named group |
| Conversation | Messages grouped by sender (5 min gap), day dividers, intro at the start of history, sender names + avatars in groups |
| History | Infinite scroll upward (cursor pages of 30). `flex-col-reverse` scroller: opens at the newest message, no jump when older pages load, "jump to latest" button |
| Sending | Optimistic bubble → server ack (10 s timeout) → saved message. Failed → "Not sent. Retry" (same `clientId`, so never duplicated) |
| Receipts | "Sent" / "Seen" (direct) or "Seen by N / everyone" (group) under your newest message |
| Typing | Sent while typing (repeats every 2.5 s, stops after 4 s idle); shown in header, list and above the composer |
| Read state | Opening a chat (or returning to the tab) marks it read; messages arriving in the open chat never count as unread |
| Reliability | Socket events update the TanStack Query cache directly; after a reconnect all chat queries are refetched |
| Layout | Desktop: two columns. Mobile: list on `/chat`, conversation on `/chat/[id]` with a back button |

## Design system

- **Tokens** live in `apps/web/src/app/globals.css`: cool neutrals (hue 265) and one indigo accent, in light and dark. Chat tokens: `canvas`, `bubble-own`, `bubble-other`, `online`, `away`.
- **Type:** Geist Sans / Geist Mono. **Radius:** 0.625rem. **Icons:** lucide.
- **Theme:** light / dark / system from the user menu. An inline script applies it before first paint, so there is no flash.
- **Layout:** two columns on desktop (sidebar 320–340 px + conversation); one column at a time on mobile.

## Shared types (`packages/shared`)

Zod schemas, API response types and the typed Socket.io event contract. **The same folder lives in both `whatsapp_backend` and `whatsapp_frontend`.** When you change it in one repo, copy the change to the other so both sides keep the same contract. (Later this can become a published npm package or a git submodule.)

## Next steps

- [ ] Message edit / delete, reactions, attachments (images/files)
- [ ] Group management: add/remove members, rename, leave
- [ ] Account settings: change password, active sessions list, sign out other devices
- [ ] Delete unverified accounts after a few days (TTL)
- [ ] Browser notifications + unread count in the tab title
