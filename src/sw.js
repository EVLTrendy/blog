const CACHE_NAME = 'blog-cache-v5';
const OFFLINE_URL = '/offline/';

// Core assets to cache immediately
const ASSETS_TO_CACHE = [
    OFFLINE_URL,
    '/assets/blog/default-og.png',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Pre-caching offline page');
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
                        console.log('[ServiceWorker] Removing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests (except for specific ones if needed, but keeping it safe)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Skip Google Analytics and other tracking
    if (event.request.url.includes('google-analytics.com') ||
        event.request.url.includes('googletagmanager.com') ||
        event.request.url.includes('analytics.js') ||
        event.request.url.includes('/g/collect')) {
        return;
    }

    // Skip API requests and dynamic content
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('/.netlify/')) {
        return;
    }

    // CSS and JS files: Network First (always get fresh version)
    if (event.request.url.endsWith('.css') || event.request.url.endsWith('.js')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Cache the new version
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to cache only if network fails
                    return caches.match(event.request);
                })
        );
        return;
    }

    // HTML Navigation Strategy: Network First, falling back to Cache, then Offline Page
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Cache the visited page for offline reading
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            return caches.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }

    // Static Assets Strategy: Cache First, falling back to Network
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }

            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                // Cache new static assets
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Fallback for images
                if (event.request.destination === 'image') {
                    return caches.match('/assets/blog/default-og.png');
                }
                return new Response('', { status: 404 });
            });
        })
    );
});

// Push Notification Event Listener
self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/assets/blog/default-og.png',
            badge: '/assets/blog/default-og.png',
            vibrate: [100, 50, 100],
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '2'
            },
            actions: [
                {
                    action: 'explore', title: 'Read Article',
                    icon: '/assets/blog/default-og.png'
                },
                {
                    action: 'close', title: 'Close',
                    icon: '/assets/blog/default-og.png'
                },
            ]
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', function (e) {
    var notification = e.notification;
    var action = e.action;

    if (action === 'close') {
        notification.close();
    } else {
        clients.openWindow('https://blog.evolvedlotus.com');
        notification.close();
    }
});

