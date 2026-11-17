// NEXT_PUBLIC_* values are inlined at build time, so they must be read literally.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const env = {
  /** Express API origin, e.g. http://localhost:4000 (no trailing slash). */
  apiUrl,
  /** Socket.io origin. Same server as the API unless set separately. */
  socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? apiUrl,
} as const;
