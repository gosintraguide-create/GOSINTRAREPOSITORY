// Automatic Translation Service
// Translates content automatically using LibreTranslate (open-source, free)

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
}

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es', 'fr', 'de', 'nl', 'it'];

// LibreTranslate API configuration
// You can use the free public instance or host your own
const LIBRE_TRANSLATE_API = 'https://libretranslate.com/translate';

/**
 * Translate text from one language to another
 * @param text Text to translate
 * @param sourceLang Source language code (e.g., 'en')
 * @param targetLang Target language code (e.g., 'pt')
 */
export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string
): Promise<TranslationResult> {
  // Don't translate if source and target are the same
  if (sourceLang === targetLang) {
    return {
      success: true,
      translatedText: text,
    };
  }

  // Don't translate empty text
  if (!text || text.trim() === '') {
    return {
      success: true,
      translatedText: text,
    };
  }

  try {
    const response = await fetch(LIBRE_TRANSLATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      translatedText: data.translatedText,
    };
  } catch (error) {
    console.error(`Translation error (${sourceLang} -> ${targetLang}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Translation failed',
      translatedText: text, // Fallback to original text
    };
  }
}

/**
 * Translate multiple texts in batch
 * @param texts Array of texts to translate
 * @param sourceLang Source language code
 * @param targetLang Target language code
 */
export async function translateBatch(
  texts: string[],
  sourceLang: string = 'en',
  targetLang: string
): Promise<string[]> {
  const results = await Promise.all(
    texts.map(text => translateText(text, sourceLang, targetLang))
  );
  
  return results.map(result => result.translatedText || '');
}

/**
 * Deep translate an object recursively
 * This handles nested objects and arrays
 */
async function translateObject(
  obj: any,
  sourceLang: string,
  targetLang: string
): Promise<any> {
  if (typeof obj === 'string') {
    const result = await translateText(obj, sourceLang, targetLang);
    return result.translatedText || obj;
  }

  if (Array.isArray(obj)) {
    return Promise.all(
      obj.map(item => translateObject(item, sourceLang, targetLang))
    );
  }

  if (obj && typeof obj === 'object') {
    const translated: any = {};
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObject(value, sourceLang, targetLang);
    }
    return translated;
  }

  return obj;
}

/**
 * Translate comprehensive content to all supported languages
 * @param content Content in the source language (default: English)
 * @param sourceLang Source language code (default: 'en')
 */
export async function translateContentToAllLanguages(
  content: any,
  sourceLang: string = 'en',
  onProgress?: (language: string, progress: number) => void
): Promise<{ [languageCode: string]: any }> {
  const translations: { [languageCode: string]: any } = {};
  
  // Keep original language content
  translations[sourceLang] = content;

  // Translate to all other languages
  const targetLanguages = SUPPORTED_LANGUAGES.filter(lang => lang !== sourceLang);
  
  for (let i = 0; i < targetLanguages.length; i++) {
    const targetLang = targetLanguages[i];
    
    if (onProgress) {
      onProgress(targetLang, (i / targetLanguages.length) * 100);
    }

    try {
      console.log(`🌍 Translating content to ${targetLang}...`);
      translations[targetLang] = await translateObject(content, sourceLang, targetLang);
      console.log(`✅ Translation to ${targetLang} complete`);
    } catch (error) {
      console.error(`❌ Failed to translate to ${targetLang}:`, error);
      // Keep original content as fallback
      translations[targetLang] = content;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (onProgress) {
    onProgress('complete', 100);
  }

  return translations;
}

/**
 * Translate specific fields of content
 * Useful for updating only certain sections
 */
export async function translateFields(
  fields: { [key: string]: string },
  sourceLang: string = 'en',
  targetLang: string
): Promise<{ [key: string]: string }> {
  const translated: { [key: string]: string } = {};
  
  for (const [key, value] of Object.entries(fields)) {
    const result = await translateText(value, sourceLang, targetLang);
    translated[key] = result.translatedText || value;
  }
  
  return translated;
}

/**
 * Check if translation service is available
 */
export async function checkTranslationService(): Promise<boolean> {
  try {
    const response = await fetch(LIBRE_TRANSLATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: 'test',
        source: 'en',
        target: 'pt',
        format: 'text',
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Translation service check failed:', error);
    return false;
  }
}
