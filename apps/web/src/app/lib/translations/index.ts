// Bridge — all existing imports from "../lib/translations" continue to work unchanged.
// The actual implementation lives in loader.ts (JSON-based, one file per language).
export { getTranslation, getUITranslation, getCookieContent } from './loader';
export type { TranslationFile } from './types';

// Privacy policy content (legal text — kept separate from translator-facing JSON files)
export { getPrivacyContent, privacyTranslations } from './privacy';
export type { PrivacyContent } from './privacy';
