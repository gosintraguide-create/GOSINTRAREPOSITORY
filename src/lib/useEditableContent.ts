import { useState, useEffect } from 'react';
import { loadComprehensiveContent, syncComprehensiveContentFromDatabase, type ComprehensiveContent, DEFAULT_COMPREHENSIVE_CONTENT } from './comprehensiveContent';

/**
 * Hook to use editable content that automatically refreshes when content is saved in admin panel
 * This enables real-time content updates from the ContentEditor
 */
export function useEditableContent(): ComprehensiveContent {
  const [content, setContent] = useState<ComprehensiveContent>(() => loadComprehensiveContent());

  // Sync from database on mount
  useEffect(() => {
    async function syncFromDatabase() {
      try {
        const freshContent = await syncComprehensiveContentFromDatabase();
        setContent(freshContent);
        console.log('✅ Synced comprehensive content from database on mount');
      } catch (error) {
        console.log('ℹ️ Using local comprehensive content (backend unavailable)');
        // Silently fail and use local content
      }
    }
    
    // Delay sync slightly to not block initial render
    const timer = setTimeout(syncFromDatabase, 100);
    
    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  useEffect(() => {
    // Listen for content updates from admin panel (same window)
    const handleContentUpdate = () => {
      setContent(loadComprehensiveContent());
    };
    
    window.addEventListener('content-updated', handleContentUpdate);
    
    // Listen for storage changes from admin panel in different tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'comprehensive-content') {
        setContent(loadComprehensiveContent());
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('content-updated', handleContentUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return content;
}