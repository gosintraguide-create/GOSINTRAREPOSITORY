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

// Get API key from localStorage if available
function getApiKey(): string | null {
  try {
    return localStorage.getItem('libretranslate-api-key');
  } catch {
    return null;
  }
}

/**
 * Translate text from one language to another with retry logic
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
      const apiKey = getApiKey();
      const requestBody: any = {
        q: text,
        source: sourceLang,
        target: targetLang,
        format: 'text',
      };

      // Add API key if available
      if (apiKey) {
        requestBody.api_key = apiKey;
      }

      const response = await fetch(LIBRE_TRANSLATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Get response text for better error logging
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to parse error details
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If not JSON, use response text
          if (responseText) {
            errorMessage += ` - ${responseText.substring(0, 200)}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);
      
      if (!data.translatedText) {
        throw new Error('No translated text in response');
      }
      
      return {
        success: true,
        translatedText: data.translatedText,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (lastError.message.includes('429') || lastError.message.includes('rate limit')) {
        console.warn(`⚠️ Rate limit hit for ${sourceLang} -> ${targetLang}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
      } else if (lastError.message.includes('403') || lastError.message.includes('API key')) {
        console.error(`❌ API key required or invalid for translation service`);
        break; // Don't retry auth errors
      } else {
        // Wait before retry for other errors
        if (attempt < retries) {
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
export async function checkTranslationService(): Promise<{ available: boolean; needsApiKey: boolean; error?: string }> {
  try {
    const apiKey = getApiKey();
    const requestBody: any = {
      q: 'test',
      source: 'en',
      target: 'pt',
      format: 'text',
    };

    if (apiKey) {
      requestBody.api_key = apiKey;
    }

    const response = await fetch(LIBRE_TRANSLATE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();

    if (response.ok) {
      return { available: true, needsApiKey: false };
    }

    // Check if it's an API key error
    if (response.status === 403 || responseText.includes('API key')) {
      return { available: false, needsApiKey: true, error: 'API key required' };
    }

    return { available: false, needsApiKey: false, error: `HTTP ${response.status}: ${responseText.substring(0, 100)}` };
  } catch (error) {
    // Silently fail - this is just a background check
    return { available: false, needsApiKey: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Set the LibreTranslate API key
 */
export function setApiKey(apiKey: string): void {
  try {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem('libretranslate-api-key', apiKey.trim());
      console.log('✅ LibreTranslate API key saved');
    } else {
      localStorage.removeItem('libretranslate-api-key');
      console.log('🗑️ LibreTranslate API key removed');
    }
  } catch (error) {
    console.error('Failed to save API key:', error);
  }
}

/**
 * Get current API key status
 */
export function hasApiKey(): boolean {
  return !!getApiKey();
}
