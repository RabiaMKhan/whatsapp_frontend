import { THEME_STORAGE_KEY } from '@/lib/theme-constants';

/**
 * Runs in <head> before the page paints, so a dark-mode user never sees a
 * white flash. Must stay plain ES5 with no imports: it runs as a raw string.
 */
const script = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
