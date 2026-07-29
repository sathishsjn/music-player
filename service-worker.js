const CACHE_NAME = "music-player-v7";

const CACHE_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./manifest.json"
];


self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(CACHE_FILES))
    );
});


self.addEventListener("activate", event => {
    event.waitUntil(
        self.clients.claim()
    );
});


self.addEventListener("fetch", event => {

    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }

            return fetch(event.request).catch(() => {
                return caches.match("./index.html");
            });
        })
    );

});
