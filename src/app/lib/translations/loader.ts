import type { TranslationFile } from './types';

// ── English is bundled synchronously — it's the universal fallback ─────────────
import en from './locales/en.json';

// Sync registry — starts with only English.
// Other locales are loaded on demand and cached here.
const registry: Record<string, TranslationFile> = {
  en: en as TranslationFile,
};

// ── Pub/sub for locale-load events ────────────────────────────────────────────
// RootLayout subscribes so it can re-render once a new locale is ready.
const listeners: Array<() => void> = [];

export function onLocaleLoad(cb: () => void): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// ── In-flight load promises (de-dup parallel calls) ───────────────────────────
const pending: Record<string, Promise<void>> = {};

const dynamicLocales: Record<string, () => Promise<{ default: unknown }>> = {
  pt: () => import('./locales/pt.json'),
  es: () => import('./locales/es.json'),
  fr: () => import('./locales/fr.json'),
  de: () => import('./locales/de.json'),
  nl: () => import('./locales/nl.json'),
  it: () => import('./locales/it.json'),
};

/**
 * Asynchronously load + cache a locale file.
 * Call this when the user picks a language so it's ready for the next render.
 */
export async function preloadTranslation(lang: string): Promise<void> {
  if (lang === 'en' || registry[lang]) return; // already loaded
  if (pending[lang]) return pending[lang];      // already loading

  const loader = dynamicLocales[lang];
  if (!loader) return;

  pending[lang] = loader()
    .then((mod) => {
      registry[lang] = (mod as { default: TranslationFile }).default;
      // Notify subscribers (RootLayout) so it can force a re-render
      listeners.forEach((cb) => cb());
    })
    .catch(() => {
      // Silently fall back to English — no broken UI
    });

  return pending[lang];
}

// ── Language registry ──────────────────────────────────────────────────────
// To add a new language:
//   1. Copy locales/en.json → locales/zh.json and translate all string values
//   2. Add an entry to dynamicLocales above:  zh: () => import('./locales/zh.json'),
//   That's it. TypeScript will error at the cast if any key is missing.

export function getTranslation(lang: string): TranslationFile {
  return registry[lang] ?? registry.en;
}

// Backward-compatible shims — components that used these functions
// continue to work without any changes.
export const getUITranslation = (lang: string) => getTranslation(lang).ui;
export const getCookieContent  = (lang: string) => getTranslation(lang).cookie;

// ── Dev-only completeness checker ─────────────────────────────────────────
if (import.meta.env.DEV) {
  function checkKeys(obj: unknown, ref: unknown, path = ''): void {
    if (typeof ref !== 'object' || ref === null || Array.isArray(ref)) return;
    for (const key of Object.keys(ref as object)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (typeof obj !== 'object' || obj === null || !(key in (obj as object))) {
        console.warn(`[i18n] Missing key: ${fullPath}`);
      } else {
        checkKeys(
          (obj as Record<string, unknown>)[key],
          (ref as Record<string, unknown>)[key],
          fullPath,
        );
      }
    }
  }
  // In DEV, eagerly load all locales so the completeness checker can run
  Promise.all(
    Object.entries(dynamicLocales).map(([lang, loader]) =>
      loader().then((mod) => {
        const data = (mod as { default: TranslationFile }).default;
        registry[lang] = data;
        checkKeys(data, registry.en, lang);
      })
    )
  ).catch(() => {});
}
