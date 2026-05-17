import { useState, useEffect } from "react";
import {
  loadComprehensiveContentForLanguage,
  syncComprehensiveContentFromDatabase,
  type ComprehensiveContent,
} from "./comprehensiveContent";

/**
 * Hook to use editable content that automatically refreshes when content is saved in admin panel
 * This enables real-time content updates from the ContentEditor
 * @param language Language code (e.g., 'en', 'pt', 'es') - defaults to 'en'
 */
export function useEditableContent(language: string = "en"): ComprehensiveContent {
  const [content, setContent] = useState<ComprehensiveContent>(() =>
    loadComprehensiveContentForLanguage(language)
  );

  // Update content when language changes
  useEffect(() => {
    setContent(loadComprehensiveContentForLanguage(language));
  }, [language]);

  // Sync from database on mount (deduplicated + TTL-gated inside syncComprehensiveContentFromDatabase)
  useEffect(() => {
    syncComprehensiveContentFromDatabase()
      .then(() => setContent(loadComprehensiveContentForLanguage(language)))
      .catch(() => { /* fall through to localStorage/defaults */ });
  }, [language]);

  useEffect(() => {
    const handleContentUpdate = () => {
      setContent(loadComprehensiveContentForLanguage(language));
    };

    window.addEventListener("content-updated", handleContentUpdate);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith("comprehensive-content")) {
        setContent(loadComprehensiveContentForLanguage(language));
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("content-updated", handleContentUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [language]);

  return content;
}
