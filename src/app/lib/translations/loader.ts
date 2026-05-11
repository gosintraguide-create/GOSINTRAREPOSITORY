import type { TranslationFile } from './types';

import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import nl from './locales/nl.json';
import it from './locales/it.json';

// ── Language registry ──────────────────────────────────────────────────────
// To add a new language:
//   1. Copy locales/en.json → locales/zh.json and translate all string values
//   2. Add:  import zh from './locales/zh.json';
//   3. Add:  zh: zh as TranslationFile,
// That's it. TypeScript will error at the cast if any key is missing.

const registry: Record<string, TranslationFile> = {
  en: en as TranslationFile,
  pt: pt as TranslationFile,
  es: es as TranslationFile,
  fr: fr as TranslationFile,
  de: de as TranslationFile,
  nl: nl as TranslationFile,
  it: it as TranslationFile,
};

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
  for (const [lang, data] of Object.entries(registry)) {
    if (lang !== 'en') checkKeys(data, registry.en, lang);
  }
}
