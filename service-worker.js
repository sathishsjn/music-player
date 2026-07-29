const CACHE_NAME = "music-player-v9";

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
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(CACHE_FILES))
            .then(() => self.skipWaiting())
    );
});

// Activate
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch
self.addEventListener("fetch", (event) => {

    // Cache only GET requests
    if (event.request.method !== "GET") {
        return;
    }

    // Don't cache audio range requests (206 Partial Content)
    if (event.request.headers.has("range")) {
        return;
    }

    event.respondWith(

        caches.match(event.request).then((cachedResponse) => {

            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((networkResponse) => {

                    // Cache only successful (200 OK) responses
                    if (
                        networkResponse &&
                        networkResponse.status === 200 &&
                        networkResponse.type === "basic"
                    ) {

                        const responseClone = networkResponse.clone();

                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseClone);
                        });

                    }

                    return networkResponse;

                })
                .catch(() => {

                    // Offline fallback for HTML pages
                    if (event.request.destination === "document") {
                        return caches.match("./index.html");
                    }

                });

        })

    );

});
