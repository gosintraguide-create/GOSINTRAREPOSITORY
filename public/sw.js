// Service Worker for Go Sintra PWA
// Version 1.3.5 - Optimized caching strategy

const CACHE_NAME = 'go-sintra-v9'; // Bumped cache version
const OFFLINE_URL = '/offline.html';

// Core assets to cache for offline functionality
// IMPORTANT: Only cache assets that definitely exist
const CORE_ASSETS = [
  '/offline.html',
  '/icon-72x72.png',
  '/manifest.json'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching core assets');
      // Cache assets individually to prevent one failure from breaking all
      return Promise.allSettled(
        CORE_ASSETS.map(url => 
          cache.add(url).catch(err => {
            console.warn(`[SW] Failed to cache ${url}:`, err);
          })
        )
      );
    }).then(() => {
      console.log('[SW] Service worker installed');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
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

  // Skip service worker itself to prevent caching loops
  if (url.pathname === '/sw.js') {
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

  // Network First Strategy for HTML navigation requests
  // This ensures users always get the latest version of pages when online
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

  // Stale-While-Revalidate Strategy for static assets (images, fonts, scripts)
  // Serve from cache immediately, then update cache in background
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request).then((response) => {
          // Update cache with fresh version
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        }).catch(() => {
          // Network failure is fine, we have cache or will fallback below
        });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // Default: Cache First, Fallback to Network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        return response;
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
  // Placeholder for offline sync logic
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