// Automatic Translation Service
// Uses MyMemory Translated API (free, no API key required)

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  error?: string;
}

// Supported languages
export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es', 'fr', 'de', 'nl', 'it'];

// MyMemory API configuration (free, no API key required)
const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

/**
 * Translate text using MyMemory API (free, no API key required)
 * Limits: 100 requests/day for anonymous users
 */
async function translateWithMyMemory(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  try {
    const langPair = `${sourceLang}|${targetLang}`;
    const encodedText = encodeURIComponent(text);
    const url = `${MYMEMORY_API}?q=${encodedText}&langpair=${langPair}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || 'Translation failed');
    }

    if (!data.responseData?.translatedText) {
      throw new Error('No translated text in response');
    }
    
    return {
      success: true,
      translatedText: data.responseData.translatedText,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Translate text from one language to another with retry logic
 * Uses MyMemory API (free, no API key required)
 * @param text Text to translate
 * @param sourceLang Source language code (e.g., 'en')
 * @param targetLang Target language code (e.g., 'pt')
 * @param retries Number of retry attempts (default: 2)
 */
export async function translateText(
  text: string,
  sourceLang: string = 'en',
  targetLang: string,
  retries: number = 2
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

  // Skip translation for very short text (likely codes or symbols)
  if (text.length < 2) {
    return {
      success: true,
      translatedText: text,
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await translateWithMyMemory(text, sourceLang, targetLang);
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Handle rate limiting
      if (lastError.message.includes('429') || lastError.message.includes('rate limit') || lastError.message.includes('MYMEMORY WARNING')) {
        console.warn(`⚠️ Rate limit hit for ${sourceLang} -> ${targetLang}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 3000 * (attempt + 1)));
      } else {
        // Wait before retry for other errors
        if (attempt < retries) {
          console.warn(`⚠️ Translation attempt ${attempt + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
  }

  // All retries failed
  const errorMsg = lastError?.message || 'Translation failed';
  console.error(`❌ Translation error (${sourceLang} -> ${targetLang}) after ${retries + 1} attempts:`, errorMsg);
  
  return {
    success: false,
    error: errorMsg,
    translatedText: text, // Fallback to original text
  };
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
export async function translateObject(
  obj: any,
  sourceLang: string,
  targetLang: string
): Promise<any> {
  if (typeof obj === 'string') {
    const result = await translateText(obj, sourceLang, targetLang);
    return result.translatedText || obj;
  }

  if (Array.isArray(obj)) {
    const results = [];
    for (const item of obj) {
      results.push(await translateObject(item, sourceLang, targetLang));
      // Small delay between array items to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
  }

  if (obj && typeof obj === 'object') {
    const translated: any = {};
    for (const [key, value] of Object.entries(obj)) {
      translated[key] = await translateObject(value, sourceLang, targetLang);
      // Small delay between object properties to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return translated;
  }

  return obj;
}

/**
 * Translate comprehensive content to all supported languages
 * @param content Content in the source language (default: English)
 * @param sourceLang Source language code (default: 'en')
 * @param onProgress Optional callback for translation progress
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
  
  console.log(`🌍 Starting translation from ${sourceLang} to ${targetLanguages.length} languages...`);
  
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

    // Delay between languages to avoid rate limiting (MyMemory allows 100/day)
    if (i < targetLanguages.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (onProgress) {
    onProgress('complete', 100);
  }

  console.log('✅ All translations complete!');
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
    // Small delay between fields to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return translated;
}

/**
 * Check if translation service is available
 */
export async function checkTranslationService(): Promise<{ available: boolean; error?: string }> {
  try {
    const result = await translateText('test', 'en', 'pt');
    
    if (result.success) {
      return { available: true };
    }
    
    return { available: false, error: result.error || 'Translation test failed' };
  } catch (error) {
    return { available: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
