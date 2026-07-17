// Aggressive cache clearing script
// This will run before the main app loads

(function() {
  'use strict';
  
  console.log('[Cache Clear] Starting aggressive cache clear...');
  
  // Function to clear all caches
  async function clearAllCaches() {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        console.log('[Cache Clear] Found caches:', cacheNames);
        
        const deletionPromises = cacheNames.map(cacheName => {
          console.log('[Cache Clear] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        });
        
        await Promise.all(deletionPromises);
        console.log('[Cache Clear] All caches cleared successfully');
        return true;
      } catch (error) {
        console.error('[Cache Clear] Error clearing caches:', error);
        return false;
      }
    } else {
      console.log('[Cache Clear] Cache API not available');
      return false;
    }
  }
  
  // Function to unregister all service workers
  async function unregisterServiceWorkers() {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('[Cache Clear] Found service workers:', registrations.length);
        
        const unregisterPromises = registrations.map(registration => {
          console.log('[Cache Clear] Unregistering service worker:', registration);
          return registration.unregister();
        });
        
        await Promise.all(unregisterPromises);
        console.log('[Cache Clear] All service workers unregistered');
        return true;
      } catch (error) {
        console.error('[Cache Clear] Error unregistering service workers:', error);
        return false;
      }
    } else {
      console.log('[Cache Clear] Service Worker API not available');
      return false;
    }
  }
  
  // Check if we should clear cache (look for force-clear flag)
  const urlParams = new URLSearchParams(window.location.search);
  const forceClear = urlParams.get('clear-cache') === 'true';
  const errorDetected = sessionStorage.getItem('module-error-detected');
  
  if (forceClear || errorDetected) {
    console.log('[Cache Clear] Force clear triggered or error detected');
    
    // Clear sessionStorage flag
    sessionStorage.removeItem('module-error-detected');
    
    // Perform aggressive clear
    Promise.all([
      clearAllCaches(),
      unregisterServiceWorkers()
    ]).then(([cachesCleared, swUnregistered]) => {
      console.log('[Cache Clear] Clear complete:', {
        cachesCleared,
        swUnregistered
      });
      
      // If we had a force-clear parameter, reload without it
      if (forceClear) {
        const newUrl = window.location.origin + window.location.pathname;
        console.log('[Cache Clear] Reloading to:', newUrl);
        window.location.href = newUrl;
      }
    }).catch(error => {
      console.error('[Cache Clear] Error during clear:', error);
    });
  }
  
  // Set up error listener for module loading errors
  window.addEventListener('error', function(e) {
    if (e.message && (
      e.message.includes('Unexpected token') || 
      e.message.includes('expected expression') ||
      e.message.includes('Unexpected identifier')
    )) {
      console.error('🚨 [Cache Clear] Module loading error detected:', e.message);
      
      // Mark that we detected an error
      sessionStorage.setItem('module-error-detected', 'true');
      
      // Check if we already tried to clear
      const clearAttempted = sessionStorage.getItem('clear-attempted');
      
      if (!clearAttempted) {
        console.log('[Cache Clear] Attempting automatic clear and reload...');
        sessionStorage.setItem('clear-attempted', 'true');
        
        // Clear and reload
        Promise.all([
          clearAllCaches(),
          unregisterServiceWorkers()
        ]).then(() => {
          console.log('[Cache Clear] Reloading page...');
          window.location.reload();
        });
      } else {
        console.error('[Cache Clear] Already attempted clear. Manual intervention needed.');
        console.error('[Cache Clear] Try adding ?clear-cache=true to the URL');
      }
    }
  }, true);
  
  // Clear the attempt flag on successful load
  window.addEventListener('load', function() {
    sessionStorage.removeItem('clear-attempted');
    sessionStorage.removeItem('module-error-detected');
  });
})();
