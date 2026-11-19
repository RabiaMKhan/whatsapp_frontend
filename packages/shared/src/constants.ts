export const APP_NAME = 'Relay';

export const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 60,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  MESSAGE_MAX: 4000,
  GROUP_NAME_MAX: 80,
  /** Members in a group, not counting the creator. */
  GROUP_MEMBERS_MAX: 49,
  MESSAGES_PAGE_SIZE: 30,
  MESSAGES_PAGE_MAX: 100,
  /** Unread counts stop at this number; the UI shows "99+". */
  UNREAD_CAP: 100,
} as const;

/** One-time email codes (verify email, reset password). */
export const AUTH_CODE = {
  LENGTH: 6,
  TTL_MINUTES: 10,
  MAX_ATTEMPTS: 5,
  RESEND_COOLDOWN_SECONDS: 60,
} as const;

/** Email invites to people who are not on the app yet. */
export const INVITE = {
  /** The same person can be invited again by the same user after this long. */
  RESEND_COOLDOWN_MINUTES: 60,
  /** Invites one user can send in 24 hours (stops the feature being used for spam). */
  DAILY_LIMIT: 20,
  /** How many sent invites the list shows. */
  LIST_LIMIT: 50,
} as const;

/** Real-time updates over Ably. */
export const REALTIME = {
  /** Presence channel: every signed-in tab enters it, so others see who is online. */
  ONLINE_CHANNEL: 'online',
  /** Ably tokens last this long; the Ably client renews them by itself. */
  TOKEN_TTL_MINUTES: 60,
  /** While the app is open it tells the API "still here" this often (saves lastSeenAt). */
  HEARTBEAT_SECONDS: 60,
  /** The app sends "typing" again this often while the user keeps typing. */
  TYPING_REPEAT_SECONDS: 2.5,
} as const;

/** Each user's private channel: the API publishes, only that user may subscribe. */
export const userChannel = (userId: string) => `user:${userId}`;

/** Error codes the API returns in `error.code`. */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ALREADY_VERIFIED: 'ALREADY_VERIFIED',
  INVALID_CODE: 'INVALID_CODE',
  CODE_EXPIRED: 'CODE_EXPIRED',
  TOO_MANY_ATTEMPTS: 'TOO_MANY_ATTEMPTS',
  EMAIL_FAILED: 'EMAIL_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
