// sw.js
const CACHE_NAME = 'study-stopwatch-cache-v1';
const urlsToCache = [
    '/',             
    '/index.html',  
    '/styles.css',
    '/script.js',
    '/face-api.min.js',
    // ...cache paths to model files in the models directory...
    '/models/tiny_face_detector_model-shard1',
    '/models/tiny_face_detector_model-weights_manifest.json',
    '/models/face_landmark_68_model-shard1',
    // ... and so on for other model files
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});