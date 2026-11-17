import {
  differenceInMinutes,
  format,
  formatDistanceToNowStrict,
  isThisWeek,
  isThisYear,
  isToday,
  isYesterday,
} from 'date-fns';

/** "Ayesha Malik" → "AM", "omar" → "O" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** Only allow same-site relative paths in ?next= (stops open redirects). */
export function safeNextPath(value: string | null, fallback = '/chat'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}

/*
 * Dates. These run only in the browser (the chat area renders after sign-in),
 * so the user's own time zone is used and there is no hydration mismatch.
 */

/** Conversation list: 14:05 · Yesterday · Mon · 12 Nov · 12/11/25 */
export function formatListTime(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEE');
  if (isThisYear(date)) return format(date, 'd MMM');
  return format(date, 'dd/MM/yy');
}

export const formatMessageTime = (iso: string) => format(new Date(iso), 'HH:mm');

/** Tooltip on a message: "Monday, 17 November 2026 at 14:05" */
export const formatFullDate = (iso: string) => format(new Date(iso), "EEEE, d MMMM yyyy 'at' HH:mm");

/** Divider between days: Today · Yesterday · Monday · Monday, 3 November · 3 November 2025 */
export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEEE');
  if (isThisYear(date)) return format(date, 'EEEE, d MMMM');
  return format(date, 'd MMMM yyyy');
}

/** Local calendar day, used to group messages under day dividers. */
export const dayKey = (iso: string) => format(new Date(iso), 'yyyy-MM-dd');

export function formatLastSeen(iso: string | null | undefined): string {
  if (!iso) return 'Offline';
  const date = new Date(iso);
  if (differenceInMinutes(new Date(), date) < 1) return 'Last seen just now';
  if (isToday(date)) return `Last seen ${formatDistanceToNowStrict(date, { addSuffix: true })}`;
  if (isYesterday(date)) return `Last seen yesterday at ${format(date, 'HH:mm')}`;
  return `Last seen ${format(date, 'd MMM')} at ${format(date, 'HH:mm')}`;
}
