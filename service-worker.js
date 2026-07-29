const CACHE_NAME = "music-player-v8";

const CACHE_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json",

    "./icons/music-logo.png",

    "./images/cover1.jpg",
    "./images/cover2.jpg",

    "./songs/song1.mp3",
    "./songs/song2.mp3"
];

// Install
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_FILES))
    );

    self.skipWaiting();
});

// Activate
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// Fetch
self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(response => {

            if (response) {
                return response;
            }

            return fetch(event.request)
                .then(networkResponse => {

                    const responseClone = networkResponse.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });

                    return networkResponse;

                })
                .catch(() => {

                    if (event.request.destination === "document") {
                        return caches.match("./index.html");
                    }

                });

        })
    );

});
