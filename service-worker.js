const CACHE_NAME = "music-player-v5";

const CACHE_FILES = [

    "./",
    "./index.html",
    "./style.css",
    "./script.js",

    "./images/cover1.jpg",
    "./images/cover2.jpg",

    "./songs/song1.mp3",
    "./songs/song2.mp3"
];



self.addEventListener("install", (event) => {

    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => {

            return cache.addAll(CACHE_FILES);

        })
        .catch((error)=>{
            console.log("Cache error:", error);
        })
    );

});



self.addEventListener("fetch", (event)=>{

    event.respondWith(

        caches.match(event.request)
        .then((response)=>{

            if(response){
                return response;
            }

            return fetch(event.request)
            .catch(()=>{

                return new Response("Offline file not available");

            });

        })

    );

});
