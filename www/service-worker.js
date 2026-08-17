 
const CACHE_NAME = "music-player-v1";

const STATIC_FILES = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./upload.html",
    "./upload.css",
    "./upload.js",
    "./assets/images/cover8.jpg"
];


// =====================================
// INSTALL
// =====================================

self.addEventListener(
    "install",
    (event) => {

        console.log(
            "Service Worker installing..."
        );

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then((cache) => {

                    return cache.addAll(
                        STATIC_FILES
                    );

                })

        );

        self.skipWaiting();

    }
);


// =====================================
// ACTIVATE
// =====================================

self.addEventListener(
    "activate",
    (event) => {

        console.log(
            "Service Worker activated"
        );

        event.waitUntil(

            caches.keys()
                .then((cacheNames) => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                (name) =>
                                    name !== CACHE_NAME
                            )
                            .map(
                                (name) =>
                                    caches.delete(name)
                            )

                    );

                })

        );

        self.clients.claim();

    }
);


// =====================================
// FETCH
// =====================================

self.addEventListener(
    "fetch",
    (event) => {

        const request =
            event.request;


        // Only GET requests

        if (
            request.method !== "GET"
        ) {

            return;

        }


        event.respondWith(

            fetch(request)
                .then((response) => {

                    return response;

                })
                .catch(() => {

                    return caches.match(
                        request
                    );

                })

        );

    }
);

