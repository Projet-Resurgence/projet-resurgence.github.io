// Service Worker for Projet Résurgence Website
// Provides offline functionality and advanced caching strategies

const CACHE_NAME = 'resurgence-v1.1.0';
const STATIC_CACHE = 'static-v1.1.0';
const DYNAMIC_CACHE = 'dynamic-v1.1.0';
const IMAGE_CACHE = 'images-v1.1.0';

// Static resources to cache immediately
const staticAssets = [
    '/',
    '/index.html',
    '/regles.html',
    '/guide.html',
    '/styles/main.css',
    '/styles/main.js',
    '/styles/seo-optimizer.js',
    '/styles/performance-optimizer.js',
    '/manifest.json'
];

// Images to cache
const imageAssets = [
    '/images/final_logo_little.png',
    '/images/final_logo_little.webp',
    '/images/final_logo_centered_little.png',
    '/images/final_logo_centered_little.webp',
    '/images/banner.jpg',
    '/images/banner.webp',
    '/images/banner.avif'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(staticAssets);
            }),
            // Cache images
            caches.open(IMAGE_CACHE).then((cache) => {
                console.log('Caching images');
                return cache.addAll(imageAssets);
            })
        ]).then(() => {
            // Skip waiting to activate immediately
            return self.skipWaiting();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE &&
                            cacheName !== DYNAMIC_CACHE &&
                            cacheName !== IMAGE_CACHE) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all pages
            self.clients.claim()
        ])
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle requests from the same origin
    if (url.origin !== location.origin) {
        return;
    }

    // Different strategies for different types of requests
    if (request.destination === 'image') {
        event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    } else if (request.destination === 'script' || request.destination === 'style') {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    } else if (request.destination === 'document') {
        event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    } else {
        event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    }
});

// Cache-first strategy for static assets
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            // Return cached version and update in background
            updateCache(request, cache);
            return cachedResponse;
        }

        // If not in cache, fetch from network
        const response = await fetch(request);

        if (response.status === 200) {
            // Cache successful responses
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('Cache-first strategy failed:', error);

        // Return offline fallback if available
        return getOfflineFallback(request);
    }
}

// Network-first strategy for HTML documents
async function networkFirstStrategy(request, cacheName) {
    try {
        const response = await fetch(request);

        if (response.status === 200) {
            // Cache successful responses
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('Network request failed, trying cache:', error);

        // Fallback to cache
        const cache = await caches.open(cacheName);
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline fallback
        return getOfflineFallback(request);
    }
}

// Update cache in background
async function updateCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
    } catch (error) {
        console.log('Background cache update failed:', error);
    }
}

// Get offline fallback
async function getOfflineFallback(request) {
    if (request.destination === 'document') {
        // Return cached index.html for offline navigation
        const cache = await caches.open(STATIC_CACHE);
        return cache.match('/index.html');
    }

    if (request.destination === 'image') {
        // Return a placeholder image or nothing
        return new Response('', { status: 404 });
    }

    return new Response('', { status: 404 });
}

// Handle background sync for analytics and form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalytics());
    }
});

// Sync analytics data when back online
async function syncAnalytics() {
    try {
        // Get stored analytics data
        const analyticsData = await getStoredAnalytics();

        if (analyticsData.length > 0) {
            // Send analytics data
            await sendAnalyticsData(analyticsData);

            // Clear stored data
            await clearStoredAnalytics();
        }
    } catch (error) {
        console.error('Analytics sync failed:', error);
    }
}

// Helper functions for analytics sync
async function getStoredAnalytics() {
    // Implementation would depend on your analytics setup
    return [];
}

async function sendAnalyticsData(data) {
    // Implementation would depend on your analytics setup
    console.log('Sending analytics data:', data);
}

async function clearStoredAnalytics() {
    // Implementation would depend on your analytics setup
    console.log('Clearing stored analytics');
}

// Handle push notifications if needed
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/images/final_logo_little.png',
            badge: '/images/final_logo_little.png',
            tag: 'resurgence-notification'
        };

        event.waitUntil(
            self.registration.showNotification('Projet Résurgence', options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});
