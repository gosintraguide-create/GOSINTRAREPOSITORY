import { useState, useEffect } from 'react';
import { loadComprehensiveContent, type ComprehensiveContent, DEFAULT_COMPREHENSIVE_CONTENT } from './comprehensiveContent';

/**
 * Hook to use editable content that automatically refreshes when content is saved in admin panel
 * This enables real-time content updates from the ContentEditor
 */
export function useEditableContent(): ComprehensiveContent {
  const [content, setContent] = useState<ComprehensiveContent>(() => loadComprehensiveContent());

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
