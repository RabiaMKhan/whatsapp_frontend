// NEXT_PUBLIC_* values are inlined at build time, so they must be read literally.

/**
 * Express API origin, e.g. http://localhost:4000 (no trailing slash).
 * "/" means "this site": in production the API is proxied through /api on the
 * web app's own domain (see rewrites in next.config.ts), so the refresh cookie
 * stays first-party.
 */
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

export const env = {
  apiUrl,
  /**
   * Socket.io origin. Same server as the API unless set separately. Must be set
   * when the API is proxied ("/"): the proxy does not carry WebSockets, so the
   * socket connects to the API server directly (it signs in with the access
   * token, not the cookie).
   */
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? apiUrl,
} as const;
