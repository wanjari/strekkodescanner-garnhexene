const CACHE = 'varetelling-v24';

self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE).then(cache =>
            cache.addAll(['./varetelling.html', './manifest.json'])
        ).catch(() => {})
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
        return;
    }

    // Network-first: hent alltid fra nett, oppdater cache, fall tilbake til cache hvis offline
    e.respondWith(
        fetch(e.request).then(response => {
            if (!response || response.status !== 200) return response;
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone)).catch(() => {});
            return response;
        }).catch(() =>
            caches.match(e.request).then(cached => cached || caches.match('./varetelling.html'))
        )
    );
});
