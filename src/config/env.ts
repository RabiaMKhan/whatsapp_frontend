// NEXT_PUBLIC_* values are inlined at build time, so they must be read literally.

/**
 * Express API origin, e.g. http://localhost:4000 (no trailing slash).
 * "/" means "this site": in production the API is proxied through /api on the
 * web app's own domain (see rewrites in next.config.ts), so the refresh cookie
 * stays first-party. Real-time updates come from Ably (token from the API).
 */
const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

export const env = {
  apiUrl,
} as const;
