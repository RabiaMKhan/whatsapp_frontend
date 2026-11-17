// Muted tones that work on light and dark backgrounds with white initials.
export const AVATAR_COLORS = [
  '#4F6BED', // slate blue
  '#0F8F7E', // teal
  '#B7791F', // amber
  '#C2410C', // burnt orange
  '#BE3B5F', // rose
  '#7C5CDB', // violet
  '#2B7FBF', // steel blue
  '#3D8B5A', // green
  '#9D4EAF', // plum
  '#5A6B85', // slate
] as const;

/** Same seed → same color. Used for user avatars (server) and group avatars (web). */
export function pickAvatarColor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!;
}
