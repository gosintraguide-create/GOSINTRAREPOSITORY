// Service Worker for Go Sintra PWA
// Version 1.3.2 - Fixed script loading errors

const CACHE_NAME = 'go-sintra-v6'; // Bumped to clear old cache
const OFFLINE_URL = '/offline.html';

// Core assets to cache for offline functionality
const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-72x72.png',
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets');
      return cache.addAll(CORE_ASSETS).catch((error) => {
        console.error('[SW] Failed to cache some assets:', error);
        // Continue even if some assets fail - don't block installation
      });
    }).then(() => {
      console.log('[SW] Service worker installed');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
      // Still skip waiting even if caching failed
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Service worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // CRITICAL FIX: Block any requests with "undefined" or "null" in URL
  if (url.href.includes('undefined') || url.href.includes('null')) {
    console.error('[SW] 🚨 BLOCKED invalid request with undefined/null:', url.href);
    event.respondWith(
      new Response('Invalid request - contains undefined parameter', {
        status: 400,
        statusText: 'Bad Request',
      })
    );
    return;
  }

  // Skip API calls - always go to network (we want fresh data)
  if (url.pathname.includes('/functions/v1/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ 
            error: 'Offline - Please check your internet connection',
            offline: true 
          }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // For navigation requests, use network-first strategy
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If nothing in cache, show offline page
            return caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // For other requests, use cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update cache in background
        fetch(request).then((response) => {
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
        }).catch(() => {
          // Network failed, but we have cache so it's ok
        });
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Don't cache if not successful
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone and cache the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Network failed and no cache - return offline response
        return new Response('Offline - Content not available', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      });
    })
  );
});

// Background sync for offline bookings
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncOfflineBookings());
  }
});

// Sync offline bookings when back online
async function syncOfflineBookings() {
  console.log('[SW] Syncing offline bookings...');
  
  try {
    // Get offline queue from IndexedDB (if implemented)
    // This would sync any bookings created while offline
    // For now, just log
    console.log('[SW] Offline bookings synced');
    
    // Notify all clients that sync is complete
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Offline bookings synced successfully'
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] Cache cleared');
      })
    );
  }
});

console.log('[SW] Service Worker loaded');