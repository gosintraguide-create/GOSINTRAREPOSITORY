import {getTranslation} from './loader';
import fingerprints from './reviewed-sources.json';

// Content freshness check, not a security primitive. A CMS edit takes precedence
// over this reviewed local edition until its translation is reviewed again.
function fingerprint(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}
export function reviewedTour<T extends {id: string; title: string; description?: string; longDescription?: string; duration: string; features?: string[]}>(tour: T, language: string): T {
  const expected = (fingerprints.tours as Record<string,string>)[tour.id];
  if (!expected || expected !== fingerprint(JSON.stringify([tour.title,tour.description,tour.longDescription,tour.duration]))) return tour;
  const copy = (getTranslation(language).editorial.tours as Record<string,object>)[tour.id];
  if (!copy) return tour;
  return {...tour, ...copy, features: tour.features?.filter(text => !/^Feature \d+$/.test(text))};
}
export function reviewedArticle(article: {id: string; translations: Record<string, {title: string; excerpt: string; content: string}>}, language: string) {
  if (language !== 'en' && article.translations[language]?.content?.trim()) return undefined;
  const source = article.translations.en;
  const expected = (fingerprints.articles as Record<string,string>)[article.id];
  if (!source || !expected || expected !== fingerprint(JSON.stringify([source.title,source.excerpt,source.content]))) return undefined;
  return (getTranslation(language).editorial.articles as Record<string, {title: string; excerpt: string; content: string; seo: {title:string;description:string;keywords:string}}>)[article.id];
}

/** Public snapshot is available only in an explicitly enabled local review build. */
export async function reviewFixture(kind: 'tours' | 'articles') {
  if (!import.meta.env?.DEV || import.meta.env.VITE_TRANSLATION_REVIEW !== 'true' || !['localhost','127.0.0.1'].includes(window.location.hostname)) return undefined;
  const data = await import('./review-fixtures.json');
  return data.default[kind];
}
