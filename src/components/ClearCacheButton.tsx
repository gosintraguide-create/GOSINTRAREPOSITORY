import { Button } from "./ui/button";
import { toast } from "sonner@2.0.3";
import { Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";

/**
 * ClearCacheButton Component
 * 
 * Provides a button to clear all caches and force a clean reload.
 * Useful for fixing PWA icon issues and other cached data problems.
 */
export function ClearCacheButton() {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllCaches = async () => {
    setIsClearing(true);
    
    try {
      console.log('🧹 Starting comprehensive cache clear...');
      
      // 1. Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`🧹 Found ${cacheNames.length} cache(s):`, cacheNames);
        
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log(`✅ Deleted cache: ${cacheName}`);
        }
      }
      
      // 2. Unregister Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`🧹 Found ${registrations.length} service worker(s)`);
        
        for (const registration of registrations) {
          await registration.unregister();
          console.log(`✅ Unregistered service worker`);
        }
      }
      
      // 3. Clear localStorage
      const localStorageKeys = Object.keys(localStorage);
      console.log(`🧹 Clearing ${localStorageKeys.length} localStorage items`);
      // Don't clear language preference
      const language = localStorage.getItem('language');
      localStorage.clear();
      if (language) {
        localStorage.setItem('language', language);
        console.log(`✅ Preserved language: ${language}`);
      }
      
      // 4. Clear sessionStorage
      sessionStorage.clear();
      console.log(`✅ Cleared sessionStorage`);
      
      // 5. Clear IndexedDB (if any)
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases?.();
        if (databases) {
          for (const db of databases) {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
              console.log(`✅ Deleted IndexedDB: ${db.name}`);
            }
          }
        }
      }
      
      // 6. Remove all icon links from DOM
      const allLinks = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]');
      allLinks.forEach(link => link.remove());
      console.log(`✅ Removed ${allLinks.length} icon/manifest links from DOM`);
      
      console.log('🎉 Cache clear complete!');
      
      toast.success('Cache cleared successfully! Reloading...', {
        description: 'The page will reload in 2 seconds'
      });
      
      // Wait 2 seconds then hard reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error clearing caches:', error);
      toast.error('Failed to clear caches', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      setIsClearing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={clearAllCaches}
        disabled={isClearing}
        variant="destructive"
        className="gap-2"
      >
        {isClearing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Clearing...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            Clear All Caches & Reload
          </>
        )}
      </Button>
      <p className="text-muted-foreground text-xs">
        Clears service worker cache, localStorage, and forces a clean reload.
        Your language preference will be preserved.
      </p>
    </div>
  );
}
