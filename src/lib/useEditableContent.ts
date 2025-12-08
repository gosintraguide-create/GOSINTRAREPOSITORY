import { useState, useEffect } from 'react';
import { loadComprehensiveContent, loadComprehensiveContentForLanguage, syncComprehensiveContentFromDatabase, type ComprehensiveContent, DEFAULT_COMPREHENSIVE_CONTENT } from './comprehensiveContent';

/**
 * Hook to use editable content that automatically refreshes when content is saved in admin panel
 * This enables real-time content updates from the ContentEditor
 * @param language Language code (e.g., 'en', 'pt', 'es') - defaults to 'en'
 */
export function useEditableContent(language: string = 'en'): ComprehensiveContent {
  const [content, setContent] = useState<ComprehensiveContent>(() => loadComprehensiveContentForLanguage(language));

  // Update content when language changes
  useEffect(() => {
    setContent(loadComprehensiveContentForLanguage(language));
  }, [language]);

  // Sync from database on mount
  useEffect(() => {
    async function syncFromDatabase() {
      try {
        const freshContent = await syncComprehensiveContentFromDatabase();
        setContent(loadComprehensiveContentForLanguage(language));
        console.log('✅ Synced comprehensive content from database on mount');
      } catch (error) {
        console.log('ℹ️ Using local comprehensive content (backend unavailable)');
        // Silently fail and use local content
      }
    }
    
    // Delay sync slightly to not block initial render
    const timer = setTimeout(syncFromDatabase, 100);
    
    return () => clearTimeout(timer);
  }, [language]); // Re-sync when language changes

  useEffect(() => {
    // Listen for content updates from admin panel (same window)
    const handleContentUpdate = () => {
      setContent(loadComprehensiveContentForLanguage(language));
    };
    
    window.addEventListener('content-updated', handleContentUpdate);
    
    // Listen for storage changes from admin panel in different tabs
    const handleStorageChange = (e: StorageEvent) => {
      // Listen for any comprehensive-content key changes
      if (e.key?.startsWith('comprehensive-content')) {
        setContent(loadComprehensiveContentForLanguage(language));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('content-updated', handleContentUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [language]);

  return content;
}