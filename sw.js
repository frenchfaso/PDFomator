// PDFomator Service Worker
// Simple offline cache for static assets

const CACHE_PREFIX = 'pdfomator-';
const CACHE_NAME = 'pdfomator-v1.3.24';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './main.js',
    './sw.js',
    './manifest.json',
    './pdfomator-icon.svg',
    './vendor/pico.red.min.css',
    './vendor/pdf.mjs',
    './vendor/pdf.worker.mjs',
    './vendor/jspdf.umd.min.js'
];

// Utility function to check if URL should be cached
function shouldCache(url) {
    const urlObj = new URL(url);

    return urlObj.origin === self.location.origin;
}

// Production logging utility
function log(level, message, ...args) {
    // In production, only log warnings and errors
    const isProduction = self.location.hostname !== 'localhost' && self.location.hostname !== '127.0.0.1';
    
    if (!isProduction || level === 'warn' || level === 'error') {
        console[level](`[SW] ${message}`, ...args);
    }
}

// Install event - cache static assets
self.addEventListener('install', event => {
    log('log', 'Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                log('log', 'Caching static assets');
                return Promise.all(
                    STATIC_ASSETS.map(async url => {
                        try {
                            await cache.add(url);
                            return { url, ok: true };
                        } catch (error) {
                            log('warn', 'Failed to cache:', url, error);
                            return { url, ok: false, error };
                        }
                    })
                );
            })
            .then((results) => {
                const failed = results.filter(result => !result.ok);
                if (failed.length > 0) {
                    throw new Error(`Failed to cache ${failed.length} required asset(s)`);
                }

                log('log', 'All assets cached successfully');
            })
            .catch(error => {
                log('error', 'Cache operation failed:', error);
                throw error;
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    log('log', 'Activate event');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME) {
                            log('log', 'Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                log('log', 'Old caches cleaned up');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Only handle requests we should cache
    if (!shouldCache(event.request.url)) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    log('log', 'Serving from cache:', event.request.url);
                    return cachedResponse;
                }
                
                log('log', 'Fetching from network:', event.request.url);
                return fetch(event.request)
                    .catch(error => {
                        log('error', 'Fetch failed:', error);
                        
                        // Return offline fallback for HTML requests
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        
                        // For other resources, throw the error
                        throw error;
                    });
            })
            .catch(error => {
                log('error', 'Cache match failed:', error);
                return fetch(event.request);
            })
    );
});

// Message handling for manual cache updates
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Background sync for export functionality (if supported)
if ('sync' in self.registration) {
    self.addEventListener('sync', event => {
        if (event.tag === 'export-pdf') {
            log('log', 'Background sync: export-pdf');
            // Could implement background PDF generation here
        }
    });
}

log('log', 'Service Worker loaded');
