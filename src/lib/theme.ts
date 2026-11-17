'use client';

import { useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from './theme-constants';

/*
 * Tiny theme store (light / dark / system) without a library.
 * The inline <ThemeScript> applies the saved theme before first paint;
 * this hook keeps React in sync and lets the user change it.
 */

export type ThemePreference = 'light' | 'dark' | 'system';

const listeners = new Set<() => void>();
const DARK_QUERY = '(prefers-color-scheme: dark)';

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function resolve(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function apply(preference: ThemePreference) {
  document.documentElement.classList.toggle('dark', resolve(preference) === 'dark');
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia(DARK_QUERY);
  const onSystemChange = () => {
    if (readPreference() === 'system') apply('system');
    listener();
  };
  media.addEventListener('change', onSystemChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', onSystemChange);
  };
}

export function setTheme(preference: ThemePreference) {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage blocked (private mode): the theme still applies for this page.
  }
  apply(preference);
  listeners.forEach((listener) => listener());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readPreference, () => 'system' as const);
  const resolvedTheme = useSyncExternalStore(
    subscribe,
    () => resolve(readPreference()),
    () => 'light' as const,
  );
  return { theme, resolvedTheme, setTheme };
}
