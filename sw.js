// PDFomator Service Worker
// Simple offline cache for static assets

const CACHE_NAME = 'pdfomator-v6';
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

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('[SW] Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Assets cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Cache failed:', error);
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
    
    // Allow specific CDN requests for our libraries
    const url = new URL(event.request.url);
    const isOwnOrigin = url.origin === self.location.origin;
    const isPicoCSS = url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('pico');
    const isPDFJS = url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('pdfjs-dist');
    const isJSPDF = url.hostname === 'cdnjs.cloudflare.com' && url.pathname.includes('jspdf');
    
    if (!isOwnOrigin && !isPicoCSS && !isPDFJS && !isJSPDF) {
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
                        // Cache successful responses
                        if (response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                        }
                        return response;
                    })
                    .catch(error => {
                        console.error('[SW] Fetch failed:', error);
                        
                        // Return offline fallback for HTML requests
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('./index.html');
                        }
                        
                        throw error;
                    });
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
