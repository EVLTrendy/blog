const CACHE_NAME = 'blog-cache-v1';
const OFFLINE_URL = '/offline/';

const ASSETS_TO_CACHE = [
    OFFLINE_URL,
    '/style.css',
    '/enhancements.css',
    '/layout-fixes.css',
    '/ux-enhancements.css',
    '/conversion-components.css',
    '/fonts.css',
    '/assets/blog/default-og.png',
    '/assets/js/copy.js',
    '/assets/js/slideshow.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Navigation requests (HTML pages)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(OFFLINE_URL);
                })
        );
        return;
    }

    // Static assets (CSS, JS, Images)
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cached response if found
            if (response) {
                return response;
            }

            // Otherwise fetch from network
            return fetch(event.request).then((networkResponse) => {
                // Check if we received a valid response
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Clone the response
                const responseToCache = networkResponse.clone();

                // Cache the new resource (if it matches our criteria - optional)
                // For now, we are only caching what's in ASSETS_TO_CACHE on install, 
                // but we could add runtime caching here for other assets.

                return networkResponse;
            });
        })
    );
});
