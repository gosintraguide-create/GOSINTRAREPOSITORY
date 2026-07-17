// Automatic Translation Service
// DISABLED - Translation is now handled by static translation files only

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
}

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es', 'fr', 'de', 'nl', 'it'];

/**
 * Translation is DISABLED - always returns original text
 * All translations should use the static translation files in lib/translations/
 */
export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string,
  retries: number = 2
): Promise<TranslationResult> {
  // Translation is disabled - return original text
  return {
    success: true,
    translatedText: text,
  };
}

/**
 * Translation is DISABLED - always returns original texts
 */
export async function translateBatch(
  texts: string[],
  sourceLang: string = 'en',
  targetLang: string
): Promise<string[]> {
  // Translation is disabled - return original texts
  return texts;
}

/**
 * Translation is DISABLED - always returns original object
 */
export async function translateObject(
  obj: any,
  sourceLang: string,
  targetLang: string
): Promise<any> {
  // Translation is disabled - return original object
  return obj;
}

/**
 * Translation is DISABLED - always returns original content
 */
export async function translateContentToAllLanguages(
  content: any,
  sourceLang: string = 'en',
  onProgress?: (language: string, progress: number) => void
): Promise<{ [languageCode: string]: any }> {
  const translations: { [languageCode: string]: any } = {};
  
  // Keep original language content for all languages (no translation)
  SUPPORTED_LANGUAGES.forEach(lang => {
    translations[lang] = content;
  });

  if (onProgress) {
    onProgress('complete', 100);
  }

  return translations;
}

/**
 * Translation is DISABLED - always returns original fields
 */
export async function translateFields(
  fields: { [key: string]: string },
  sourceLang: string = 'en',
  targetLang: string
): Promise<{ [key: string]: string }> {
  // Translation is disabled - return original fields
  return fields;
}

/**
 * Translation service is disabled
 */
export async function checkTranslationService(): Promise<{ available: boolean; needsApiKey: boolean; error?: string }> {
  return { available: false, needsApiKey: false, error: 'Translation service is disabled' };
}

/**
 * API key functions are disabled
 */
export function setApiKey(apiKey: string): void {
  console.log('⚠️ Translation service is disabled - API key not needed');
}

/**
 * API key functions are disabled
 */
export function hasApiKey(): boolean {
  return false;
}