import {createContext, useCallback, useContext, useSyncExternalStore} from 'react';
import {getTranslation, getLocaleVersion, onLocaleLoad} from './loader';
import supplemental from './website-ui.json';
import {normalizeWebsiteLanguage} from './language';

export const WebsiteLanguageContext = createContext('en');
const cache = new WeakMap<object, Map<string, string>>();
function dictionary(language: string) {
  const target = getTranslation(language);
  let result = cache.get(target);
  if (result) return result;
  result = new Map();
  const visit = (source: unknown, translated: unknown) => {
    if (typeof source === 'string' && typeof translated === 'string') {
      if (!result!.has(source)) result!.set(source, translated);
    } else if (source && translated && typeof source === 'object' && typeof translated === 'object') {
      for (const key of Object.keys(source)) visit((source as any)[key], (translated as any)[key]);
    }
  };
  visit(getTranslation('en'), target);
  cache.set(target, result);
  return result;
}
/** Exact source messages only; never translates identifiers, URLs or arbitrary user content. */
export function websiteText(language: string, source: string, values: Record<string, string | number> = {}) {
  language = normalizeWebsiteLanguage(language);
  const row = (supplemental as Record<string, Record<string, string>>)[source];
  const text = row?.[language] ?? row?.en ?? dictionary(language).get(source) ?? source;
  return text.replace(/\{(\w+)\}/g, (match, key) => values[key] === undefined ? match : String(values[key]));
}
export function useWebsiteText(explicitLanguage?: string) {
  const contextLanguage = useContext(WebsiteLanguageContext);
  const language = explicitLanguage || contextLanguage;
  const version = useSyncExternalStore(onLocaleLoad, getLocaleVersion, getLocaleVersion);
  return useCallback((source: string, values?: Record<string, string | number>) => websiteText(language, source, values), [language, version]);
}
export function WebsiteText({text}: {text: string}) {
  const t = useWebsiteText();
  return <>{t(text)}</>;
}

/** Localise recognised shipped copy while retaining CMS media, settings and custom content. */
export function localizeWebsiteContent<T>(value: T, language: string): T {
  if (typeof value === 'string') return websiteText(language, value) as T;
  if (Array.isArray(value)) return value.map(child => localizeWebsiteContent(child, language)) as T;
  if (!value || typeof value !== 'object') return value;
  const untouched = /^(id|slug|url|href|src|image|imageUrl|heroImage|icon|email|phone|whatsappNumber|type|category|status)$/i;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, untouched.test(key) ? child : localizeWebsiteContent(child, language)])) as T;
}
