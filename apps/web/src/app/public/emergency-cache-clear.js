/**
 * EMERGENCY CACHE CLEAR SCRIPT
 * 
 * If you're seeing "Failed to fetch dynamically imported module" errors,
 * follow these steps:
 * 
 * 1. Open Developer Tools (Press F12)
 * 2. Go to the "Console" tab
 * 3. Copy and paste this entire script
 * 4. Press Enter
 * 5. Wait for "CACHE CLEARED!" message
 * 6. Page will automatically reload
 */

(async function emergencyCacheClear() {
  console.log('🚨 EMERGENCY CACHE CLEAR STARTING...');
  
  try {
    // Step 1: Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} caches:`, cacheNames);
      
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`✅ Deleted cache: ${cacheName}`);
      }
    }
    
    // Step 2: Unregister service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`Found ${registrations.length} service worker(s)`);
      
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✅ Unregistered service worker');
      }
    }
    
    // Step 3: Clear localStorage (preserve language and session)
    const language = localStorage.getItem('language');
    const adminSession = localStorage.getItem('admin-session');
    const driverSession = localStorage.getItem('driver-session');
    
    localStorage.clear();
    
    if (language) localStorage.setItem('language', language);
    if (adminSession) localStorage.setItem('admin-session', adminSession);
    if (driverSession) localStorage.setItem('driver-session', driverSession);
    
    console.log('✅ Cleared localStorage (preserved sessions)');
    
    // Step 4: Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ Cleared sessionStorage');
    
    // Step 5: Clear IndexedDB
    if ('indexedDB' in window && indexedDB.databases) {
      const databases = await indexedDB.databases();
      for (const db of databases) {
        if (db.name) {
          indexedDB.deleteDatabase(db.name);
          console.log(`✅ Deleted IndexedDB: ${db.name}`);
        }
      }
    }
    
    console.log('');
    console.log('🎉 CACHE CLEARED SUCCESSFULLY!');
    console.log('🔄 Reloading page in 2 seconds...');
    console.log('');
    
    setTimeout(() => {
      window.location.reload(true);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error during cache clear:', error);
    console.log('');
    console.log('⚠️ Manual fallback: Press Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
  }
})();
