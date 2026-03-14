const CACHE = 'varetelling-v6';

self.addEventListener('install', e => {
    // Cache kun selve HTML-filen ved install
    e.waitUntil(
        caches.open(CACHE).then(cache =>
            cache.addAll(['./varetelling.html', './manifest.json'])
        ).catch(() => {}) // ikke krasj hvis noe feiler
    );
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    const url = e.request.url;

    // Send API-kall direkte uten å røre dem
    if (url.includes('api.mystore.no') ||
        url.includes('fonts.googleapis.com') ||
        url.includes('fonts.gstatic.com') ||
        url.includes('unpkg.com')) {
        return; // la nettleseren håndtere det
    }

    e.respondWith(
        caches.match(e.request).then(cached => {
            if (cached) return cached;
            return fetch(e.request).then(response => {
                if (!response || response.status !== 200) return response;
                const clone = response.clone();
                caches.open(CACHE).then(cache => cache.put(e.request, clone)).catch(() => {});
                return response;
            }).catch(() => caches.match('./varetelling.html'));
        })
    );
});
