// PDFomator Service Worker
// Simple offline cache for static assets

const CACHE_NAME = 'pdfomator-v1.2.2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './main.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.red.min.css',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.mjs',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.mjs',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.2/jspdf.umd.min.js'
];

// Utility function to check if URL should be cached
function shouldCache(url) {
    const urlObj = new URL(url);
    const isOwnOrigin = urlObj.origin === self.location.origin;
    const isPicoCSS = urlObj.hostname === 'cdn.jsdelivr.net' && urlObj.pathname.includes('pico');
    const isPDFJS = urlObj.hostname === 'cdn.jsdelivr.net' && urlObj.pathname.includes('pdfjs-dist');
    const isJSPDF = urlObj.hostname === 'cdnjs.cloudflare.com' && urlObj.pathname.includes('jspdf');
    
    return isOwnOrigin || isPicoCSS || isPDFJS || isJSPDF;
}

// Utility function to check if response should be cached
function shouldCacheResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const cacheableTypes = [
        'text/html',
        'text/css', 
        'text/javascript',
        'application/javascript',
        'application/json',
        'image/',
        'font/'
    ];
    
    return cacheableTypes.some(type => contentType.includes(type));
}

// Production logging utility
function log(level, message, ...args) {
    // In production, only log warnings and errors
    const isProduction = self.location.hostname !== 'localhost' && self.location.hostname !== '127.0.0.1';
    
    if (!isProduction || level === 'warn' || level === 'error') {
        console[level](`[SW] ${message}`, ...args);
    }
}

// Utility function to manage cache size
async function limitCacheSize(cacheName, maxEntries = 50) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
        // Remove oldest entries (first in, first out)
        const entriesToDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(
            entriesToDelete.map(key => {
                log('log', 'Removing old cache entry:', key.url);
                return cache.delete(key);
            })
        );
    }
}

// Install event - cache static assets
self.addEventListener('install', event => {
    log('log', 'Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                log('log', 'Caching static assets');
                // Cache assets one by one to better handle failures
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => 
                        cache.add(url).catch(error => {
                            log('warn', 'Failed to cache:', url, error);
                            return null; // Continue with other assets
                        })
                    )
                );
            })
            .then((results) => {
                const failed = results.filter(result => result.status === 'rejected');
                if (failed.length > 0) {
                    log('warn', 'Some assets failed to cache:', failed.length);
                } else {
                    log('log', 'All assets cached successfully');
                }
                return self.skipWaiting();
            })
            .catch(error => {
                log('error', 'Cache operation failed:', error);
                // Still skip waiting to allow the new SW to activate
                return self.skipWaiting();
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
                        if (cacheName !== CACHE_NAME) {
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
                    .then(response => {
                        // Only cache successful responses and specific content types
                        if (response.status === 200 && shouldCacheResponse(response)) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(async cache => {
                                    await cache.put(event.request, responseClone);
                                    // Manage cache size to prevent unlimited growth
                                    await limitCacheSize(CACHE_NAME);
                                })
                                .catch(error => {
                                    log('warn', 'Failed to cache response:', error);
                                });
                        }
                        return response;
                    })
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
