// PDFomator Service Worker
// Simple offline cache for static assets

const CACHE_NAME = 'pdfomator-v1.0.4';
const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './main.js',
    './manifest.json',
    'https://cdn.jsdelivr.net/npm/@picocss/pico@v2/css/pico.min.css',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.mjs',
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/3.0.1/jspdf.umd.min.js'
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

// Utility function to manage cache size
async function limitCacheSize(cacheName, maxEntries = 50) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
        // Remove oldest entries (first in, first out)
        const entriesToDelete = keys.slice(0, keys.length - maxEntries);
        await Promise.all(
            entriesToDelete.map(key => {
                console.log('[SW] Removing old cache entry:', key.url);
                return cache.delete(key);
            })
        );
    }
}

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                // Cache assets one by one to better handle failures
                return Promise.allSettled(
                    STATIC_ASSETS.map(url => 
                        cache.add(url).catch(error => {
                            console.warn('[SW] Failed to cache:', url, error);
                            return null; // Continue with other assets
                        })
                    )
                );
            })
            .then((results) => {
                const failed = results.filter(result => result.status === 'rejected');
                if (failed.length > 0) {
                    console.warn('[SW] Some assets failed to cache:', failed.length);
                } else {
                    console.log('[SW] All assets cached successfully');
                }
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Cache operation failed:', error);
                // Still skip waiting to allow the new SW to activate
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activate event');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Old caches cleaned up');
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
                    console.log('[SW] Serving from cache:', event.request.url);
                    return cachedResponse;
                }
                
                console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then(response => {
                        // Only cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(async cache => {
                                    await cache.put(event.request, responseClone);
                                    // Manage cache size to prevent unlimited growth
                                    await limitCacheSize(CACHE_NAME);
                                })
                                .catch(error => {
                                    console.warn('[SW] Failed to cache response:', error);
                                });
                        }
                        return response;
                    })
                    .catch(error => {
                        console.error('[SW] Fetch failed:', error);
                        
                        // Return offline fallback for HTML requests
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        
                        // For other resources, throw the error
                        throw error;
                    });
            })
            .catch(error => {
                console.error('[SW] Cache match failed:', error);
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
            console.log('[SW] Background sync: export-pdf');
            // Could implement background PDF generation here
        }
    });
}

console.log('[SW] Service Worker loaded');
