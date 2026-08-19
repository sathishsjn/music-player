/* =========================================================
   MUSIC PLAYER V2
   Complete + Stable Player
   ========================================================= */


/* =========================================================
   DOM ELEMENTS
========================================================= */

const audio = document.getElementById("audio");

const cover = document.getElementById("cover");

const title = document.getElementById("title");

const artist = document.getElementById("artist");

const progress = document.getElementById("progress");

const currentTime = document.getElementById("current");

const durationTime = document.getElementById("duration");

const playBtn = document.getElementById("play");

const playIcon = document.getElementById("playIcon");

const prevBtn = document.getElementById("prev");

const nextBtn = document.getElementById("next");

const shuffleBtn = document.getElementById("shuffle");

const playlistBtn = document.getElementById("playlistBtn");

const playlistPanel = document.getElementById("playlistPanel");

const closePlaylist = document.getElementById("closePlaylist");

const playlist = document.getElementById("playlist");

const songCount = document.getElementById("songCount");

const favoriteBtn = document.getElementById("favoriteBtn");

const downloadBtn = document.getElementById("downloadBtn");

const moreBtn = document.getElementById("moreBtn");

const moreMenu = document.getElementById("moreMenu");

const closeMore = document.getElementById("closeMore");


/* =========================================================
   OPTIONAL ELEMENTS
   These may or may not exist in your HTML
========================================================= */

const repeatBtn = document.getElementById("repeatBtn");

const lyricsBtn = document.getElementById("lyricsBtn");

const lyricsPanel = document.getElementById("lyricsPanel");

const coverTab = document.getElementById("coverTab");

const lyricTab = document.getElementById("lyricTab");


/* =========================================================
   API
========================================================= */

const API_URL = "https://music-player-0qp9.onrender.com";


/* =========================================================
   DEFAULT COVER
========================================================= */

const DEFAULT_COVER =
    "assets/images/default-cover.jpg";


/* =========================================================
   STATE
========================================================= */

let songs = [];

let currentIndex = 0;

let isShuffle = false;

let isRepeat = false;

let isPlaying = false;


/* =========================================================
   FAVORITES
========================================================= */

let favorites = [];

try {

    const savedFavorites =
        localStorage.getItem("musicFavorites");

    favorites =
        savedFavorites
            ? JSON.parse(savedFavorites)
            : [];

    if (!Array.isArray(favorites)) {
        favorites = [];
    }

} catch (error) {

    console.warn(
        "Could not load favorites:",
        error
    );

    favorites = [];
}


/* =========================================================
   MEDIA SESSION
========================================================= */

/*
   Capacitor MediaSession plugin:
   window.Capacitor.Plugins.MediaSession

   Browser fallback:
   navigator.mediaSession
*/

let MediaSession = null;


/* =========================================================
   INITIALIZE MEDIA SESSION
========================================================= */

function initializeMediaSession() {

    try {

        /* Capacitor */

        if (
            window.Capacitor &&
            window.Capacitor.Plugins &&
            window.Capacitor.Plugins.MediaSession
        ) {

            MediaSession =
                window.Capacitor.Plugins.MediaSession;

            console.log(
                "Native MediaSession detected"
            );

            return;

        }


        /* Browser */

        if ("mediaSession" in navigator) {

            MediaSession =
                navigator.mediaSession;

            console.log(
                "Browser MediaSession detected"
            );

            return;
        }


        console.log(
            "MediaSession not available"
        );

    } catch (error) {

        console.warn(
            "MediaSession initialization error:",
            error
        );

        MediaSession = null;
    }
}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMediaSession();

        setupEventListeners();

        setupMediaSession();

        loadSongs();

    }
);


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {


    /* PLAY */

    if (playBtn) {

        playBtn.addEventListener(
            "click",
            togglePlay
        );

    }


    /* NEXT */

    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            nextSong
        );

    }


    /* PREVIOUS */

    if (prevBtn) {

        prevBtn.addEventListener(
            "click",
            prevSong
        );

    }


    /* SHUFFLE */

    if (shuffleBtn) {

        shuffleBtn.addEventListener(
            "click",
            toggleShuffle
        );

    }


    /* REPEAT */

    if (repeatBtn) {

        repeatBtn.addEventListener(
            "click",
            toggleRepeat
        );

    }


    /* FAVORITE */

    if (favoriteBtn) {

        favoriteBtn.addEventListener(
            "click",
            toggleFavorite
        );

    }


    /* DOWNLOAD */

    if (downloadBtn) {

        downloadBtn.addEventListener(
            "click",
            downloadCurrentSong
        );

    }


    /* PLAYLIST OPEN */

    if (playlistBtn) {

        playlistBtn.addEventListener(
            "click",
            openPlaylist
        );

    }


    /* PLAYLIST CLOSE */

    if (closePlaylist) {

        closePlaylist.addEventListener(
            "click",
            closePlaylistPanel
        );

    }


    /* MORE */

    if (moreBtn) {

        moreBtn.addEventListener(
            "click",
            toggleMoreMenu
        );

    }


    /* CLOSE MORE */

    if (closeMore) {

        closeMore.addEventListener(
            "click",
            closeMoreMenu
        );

    }


    /* LYRICS */

    if (lyricsBtn) {

        lyricsBtn.addEventListener(
            "click",
            toggleLyrics
        );

    }


    /* COVER TAB */

    if (coverTab) {

        coverTab.addEventListener(
            "click",
            () => {

                setPlayerView("cover");

            }
        );

    }


    /* LYRIC TAB */

    if (lyricTab) {

        lyricTab.addEventListener(
            "click",
            () => {

                setPlayerView("lyrics");

            }
        );

    }


    /* PROGRESS */

    if (progress) {

        progress.addEventListener(
            "input",
            seekAudio
        );

    }


    /* OUTSIDE MORE MENU */

    document.addEventListener(
        "click",
        handleOutsideClick
    );


    /* AUDIO EVENTS */

    if (audio) {

        audio.addEventListener(
            "play",
            handleAudioPlay
        );

        audio.addEventListener(
            "pause",
            handleAudioPause
        );

        audio.addEventListener(
            "ended",
            handleAudioEnded
        );

        audio.addEventListener(
            "timeupdate",
            updateProgress
        );

        audio.addEventListener(
            "loadedmetadata",
            handleMetadata
        );

        audio.addEventListener(
            "error",
            handleAudioError
        );

        audio.addEventListener(
            "loadstart",
            () => {

                console.log(
                    "Audio loading..."
                );

            }
        );

        audio.addEventListener(
            "canplay",
            () => {

                console.log(
                    "Audio ready"
                );

            }
        );

    }

}


/* =========================================================
   LOAD SONGS
========================================================= */

async function loadSongs() {

    try {

        console.log(
            "Loading songs..."
        );


        const response =
            await fetch(
                `${API_URL}/api/songs`,
                {
                    method: "GET",
                    cache: "no-cache"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Failed to load songs (${response.status})`
            );

        }


        const data =
            await response.json();


        console.log(
            "Backend response:",
            data
        );


        /*
           IMPORTANT FIX

           Backend may return:

           [
             {...},
             {...}
           ]

           OR:

           {
             songs: [
               {...},
               {...}
             ]
           }
        */

        if (Array.isArray(data)) {

            songs = data;

        } else if (
            data &&
            Array.isArray(data.songs)
        ) {

            songs = data.songs;

        } else {

            console.error(
                "Invalid songs response:",
                data
            );

            songs = [];

        }


        console.log(
            "Player songs:",
            songs
        );


        /*
           EXTRA SAFETY

           Prevent:
           songs.forEach is not a function
        */

        if (!Array.isArray(songs)) {

            songs = [];

        }


        updateSongCount();


        /*
           NO SONGS
        */

        if (songs.length === 0) {

            showEmptyPlayer();

            renderPlaylist();

            return;

        }


        /*
           GET SONG FROM URL

           player.html?id=5
        */

        const params =
            new URLSearchParams(
                window.location.search
            );

        const songId =
            params.get("id");


        let selectedIndex = -1;


        if (songId) {

            selectedIndex =
                songs.findIndex(
                    (song) =>
                        String(song.id) ===
                        String(songId)
                );


            if (selectedIndex === -1) {

                console.warn(
                    "Song ID not found:",
                    songId
                );

                selectedIndex = 0;

            }

        } else {

            selectedIndex =
                getSavedSongIndex();

        }


        /*
           DEFAULT SONG
        */

        currentIndex =
            selectedIndex >= 0 &&
            selectedIndex < songs.length
                ? selectedIndex
                : 0;


        /*
           LOAD CURRENT SONG
        */

        loadSong(currentIndex);


        /*
           RENDER PLAYLIST
        */

        renderPlaylist();


        console.log(
            "Songs loaded successfully:",
            songs.length
        );


    } catch (error) {

        console.error(
            "Song loading error:",
            error
        );


        songs = [];


        showPlayerError(
            "Unable to load songs"
        );


        renderPlaylist();

    }

}


/* =========================================================
   GET SAVED SONG INDEX
========================================================= */

function getSavedSongIndex() {

    try {

        const savedIndex =
            Number(
                localStorage.getItem(
                    "currentSongIndex"
                )
            );


        const selectedSongRaw =
            localStorage.getItem(
                "selectedSong"
            );


        let selectedSong = null;


        if (selectedSongRaw) {

            selectedSong =
                JSON.parse(
                    selectedSongRaw
                );

        }


        /*
           Check saved index
        */

        if (
            Number.isInteger(savedIndex) &&
            savedIndex >= 0 &&
            savedIndex < songs.length
        ) {

            /*
               If selected song exists,
               make sure IDs match.
            */

            if (
                selectedSong &&
                selectedSong.id !== undefined
            ) {

                if (
                    String(
                        songs[savedIndex].id
                    ) ===
                    String(
                        selectedSong.id
                    )
                ) {

                    return savedIndex;

                }

            } else {

                return savedIndex;

            }

        }


        /*
           Search by saved song ID
        */

        if (
            selectedSong &&
            selectedSong.id !== undefined
        ) {

            const foundIndex =
                songs.findIndex(
                    (song) =>
                        String(song.id) ===
                        String(selectedSong.id)
                );


            if (foundIndex !== -1) {

                return foundIndex;

            }

        }


    } catch (error) {

        console.warn(
            "Could not restore previous song:",
            error
        );

    }


    return -1;

}


/* =========================================================
   LOAD SONG
========================================================= */

function loadSong(index) {

    if (!Array.isArray(songs)) {

        console.error(
            "songs is not an array"
        );

        return;

    }


    if (!songs.length) {

        return;

    }


    if (
        index < 0 ||
        index >= songs.length
    ) {

        index = 0;

    }


    const song =
        songs[index];


    if (!song) {

        console.error(
            "Song not found:",
            index
        );

        return;

    }


    currentIndex =
        index;


    console.log(
        "Loading song:",
        song
    );


    /*
       STOP CURRENT AUDIO
    */

    if (audio) {

        audio.pause();

    }


    isPlaying = false;


    /*
       TITLE
    */

    if (title) {

        title.textContent =
            song.title ||
            "Unknown Song";

    }


    /*
       ARTIST
    */

    if (artist) {

        artist.textContent =
            song.artist ||
            "Unknown Artist";

    }


    /*
       COVER
    */

    const coverURL =
        getCoverURL(song);


    if (cover) {

        cover.src =
            coverURL;


        cover.onerror =
            () => {

                cover.onerror = null;

                cover.src =
                    DEFAULT_COVER;

            };

    }


    /*
       AUDIO URL
    */

    const audioURL =
        getAudioURL(song);


    if (audio) {

        if (audioURL) {

            audio.src =
                audioURL;

        } else {

            audio.removeAttribute(
                "src"
            );

        }

        audio.load();

    }


    /*
       RESET PROGRESS
    */

    if (progress) {

        progress.min = 0;

        progress.max = 100;

        progress.value = 0;

    }


    if (currentTime) {

        currentTime.textContent =
            "0:00";

    }


    if (durationTime) {

        durationTime.textContent =
            "0:00";

    }


    /*
       PAGE TITLE
    */

    document.title =
        `${song.title || "Music Player"} | Music Player`;


    /*
       SAVE CURRENT SONG
    */

    try {

        localStorage.setItem(
            "currentSongIndex",
            String(currentIndex)
        );


        localStorage.setItem(
            "selectedSong",
            JSON.stringify(song)
        );

    } catch (error) {

        console.warn(
            "Could not save current song:",
            error
        );

    }


    /*
       FAVORITE
    */

    updateFavorite();


    /*
       PLAYLIST ACTIVE ITEM
    */

    updatePlaylistActive();


    /*
       MEDIA SESSION
    */

    updateMediaSession(
        song
    );


    /*
       BUTTON
    */

    updatePlayButton();

}


/* =========================================================
   AUDIO URL
========================================================= */

function getAudioURL(song) {

    if (!song) {

        return "";

    }


    const rawURL =
        song.audio_url ||
        song.song ||
        "";


    if (!rawURL) {

        return "";

    }


    return makeAbsoluteURL(
        rawURL
    );

}


/* =========================================================
   COVER URL
========================================================= */

function getCoverURL(song) {

    if (!song) {

        return DEFAULT_COVER;

    }


    const rawURL =
        song.cover_url ||
        song.cover ||
        "";


    if (!rawURL) {

        return DEFAULT_COVER;

    }


    return makeAbsoluteURL(
        rawURL
    );

}


/* =========================================================
   MAKE ABSOLUTE URL
========================================================= */

function makeAbsoluteURL(url) {

    if (!url) {

        return "";

    }


    const cleanURL =
        String(url).trim();


    if (
        cleanURL.startsWith("http://") ||
        cleanURL.startsWith("https://") ||
        cleanURL.startsWith("data:") ||
        cleanURL.startsWith("blob:")
    ) {

        return cleanURL;

    }


    if (
        cleanURL.startsWith("//")
    ) {

        return (
            window.location.protocol +
            cleanURL
        );

    }


    if (
        cleanURL.startsWith("/")
    ) {

        return (
            API_URL +
            cleanURL
        );

    }


    /*
       Relative frontend asset
       such as:

       assets/images/cover.jpg
    */

    return cleanURL;

}


/* =========================================================
   PLAY
========================================================= */

async function playSong() {

    if (!audio) {

        return;

    }


    if (!songs.length) {

        return;

    }


    if (!audio.src) {

        const song =
            songs[currentIndex];

        const audioURL =
            getAudioURL(song);


        if (!audioURL) {

            console.error(
                "No audio URL found"
            );

            return;

        }


        audio.src =
            audioURL;

        audio.load();

    }


    try {

        await audio.play();


        isPlaying = true;


        updatePlayButton();


        updateMediaPlaybackState(
            "playing"
        );


    } catch (error) {

        console.error(
            "Play error:",
            error
        );

    }

}


/* =========================================================
   PAUSE
========================================================= */

function pauseSong() {

    if (!audio) {

        return;

    }


    audio.pause();


    isPlaying = false;


    updatePlayButton();


    updateMediaPlaybackState(
        "paused"
    );

}


/* =========================================================
   TOGGLE PLAY
========================================================= */

function togglePlay() {

    if (!audio) {

        return;

    }


    if (audio.paused) {

        playSong();

    } else {

        pauseSong();

    }

}


/* =========================================================
   PLAY BUTTON UI
========================================================= */

function updatePlayButton() {

    if (!playIcon) {

        return;

    }


    if (isPlaying) {

        playIcon.className =
            "fa-solid fa-pause";

    } else {

        playIcon.className =
            "fa-solid fa-play";

    }

}


/* =========================================================
   AUDIO PLAY EVENT
========================================================= */

function handleAudioPlay() {

    isPlaying = true;


    updatePlayButton();


    updateMediaPlaybackState(
        "playing"
    );

}


/* =========================================================
   AUDIO PAUSE EVENT
========================================================= */

function handleAudioPause() {

    isPlaying = false;


    updatePlayButton();


    updateMediaPlaybackState(
        "paused"
    );

}


/* =========================================================
   AUDIO ENDED
========================================================= */

function handleAudioEnded() {

    isPlaying = false;


    /*
       REPEAT CURRENT SONG
    */

    if (isRepeat) {

        if (audio) {

            audio.currentTime = 0;

            playSong();

        }

        return;

    }


    /*
       NORMAL NEXT
    */

    nextSong();

}


/* =========================================================
   NEXT SONG
========================================================= */

function nextSong() {

    if (!songs.length) {

        return;

    }


    let nextIndex;


    /*
       SHUFFLE
    */

    if (isShuffle) {

        if (songs.length === 1) {

            nextIndex = 0;

        } else {

            do {

                nextIndex =
                    Math.floor(
                        Math.random() *
                        songs.length
                    );

            } while (
                nextIndex ===
                currentIndex
            );

        }

    } else {

        nextIndex =
            (currentIndex + 1) %
            songs.length;

    }


    loadSong(
        nextIndex
    );


    playSong();

}


/* =========================================================
   PREVIOUS SONG
========================================================= */

function prevSong() {

    if (!songs.length) {

        return;

    }


    /*
       If currently playing for more
       than 3 seconds,
       restart current song.
    */

    if (
        audio &&
        audio.currentTime > 3
    ) {

        audio.currentTime = 0;

        return;

    }


    const previousIndex =
        (
            currentIndex -
            1 +
            songs.length
        ) %
        songs.length;


    loadSong(
        previousIndex
    );


    playSong();

}


/* =========================================================
   SHUFFLE
========================================================= */

function toggleShuffle() {

    isShuffle =
        !isShuffle;


    if (shuffleBtn) {

        shuffleBtn.classList.toggle(
            "active",
            isShuffle
        );

    }


    try {

        localStorage.setItem(
            "musicShuffle",
            String(isShuffle)
        );

    } catch (error) {

        console.warn(
            error
        );

    }

}


/* =========================================================
   REPEAT
========================================================= */

function toggleRepeat() {

    isRepeat =
        !isRepeat;


    if (repeatBtn) {

        repeatBtn.classList.toggle(
            "active",
            isRepeat
        );

    }

}


/* =========================================================
   FAVORITE
========================================================= */

function toggleFavorite() {

    if (!songs.length) {

        return;

    }


    const song =
        songs[currentIndex];


    if (!song) {

        return;

    }


    /*
       Prefer DB ID
       fallback to title
    */

    const id =
        String(
            song.id ??
            song.title ??
            currentIndex
        );


    const existingIndex =
        favorites.indexOf(id);


    if (existingIndex === -1) {

        favorites.push(id);

    } else {

        favorites.splice(
            existingIndex,
            1
        );

    }


    try {

        localStorage.setItem(
            "musicFavorites",
            JSON.stringify(favorites)
        );

    } catch (error) {

        console.warn(
            "Could not save favorite:",
            error
        );

    }


    updateFavorite();

}


/* =========================================================
   UPDATE FAVORITE UI
========================================================= */

function updateFavorite() {

    if (
        !favoriteBtn ||
        !songs.length
    ) {

        return;

    }


    const song =
        songs[currentIndex];


    if (!song) {

        return;

    }


    const id =
        String(
            song.id ??
            song.title ??
            currentIndex
        );


    const isFavorite =
        favorites.includes(id);


    favoriteBtn.classList.toggle(
        "active",
        isFavorite
    );


    favoriteBtn.innerHTML =
        isFavorite

            ? '<i class="fa-solid fa-heart"></i>'

            : '<i class="fa-regular fa-heart"></i>';

}


/* =========================================================
   DOWNLOAD CURRENT SONG
========================================================= */

async function downloadCurrentSong() {

    if (!songs.length) {

        return;

    }


    const song =
        songs[currentIndex];


    if (!song) {

        return;

    }


    const url =
        getAudioURL(song);


    if (!url) {

        console.error(
            "No download URL found"
        );

        return;

    }


    const filename =
        sanitizeFilename(
            song.title ||
            "song"
        ) + ".mp3";


    /*
       Try fetch + blob first.
       This works when server allows CORS.
    */

    try {

        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Download failed"
            );

        }


        const blob =
            await response.blob();


        const blobURL =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            blobURL;

        link.download =
            filename;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    blobURL
                );

            },
            1000
        );


    } catch (error) {

        /*
           Cross-origin fallback
        */

        console.warn(
            "Blob download unavailable. Using direct URL.",
            error
        );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;

        link.download =
            filename;

        link.target =
            "_blank";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

    }

}


/* =========================================================
   SANITIZE FILENAME
========================================================= */

function sanitizeFilename(name) {

    return String(name)
        .replace(
            /[<>:"/\\|?*]/g,
            ""
        )
        .trim() ||
        "song";

}


/* =========================================================
   PLAYLIST
========================================================= */

function renderPlaylist() {

    if (!playlist) {

        return;

    }


    playlist.innerHTML = "";


    updateSongCount();


    /*
       IMPORTANT SAFETY FIX

       Prevent:

       songs.forEach is not a function
    */

    if (!Array.isArray(songs)) {

        console.error(
            "Playlist error: songs is not an array",
            songs
        );

        return;

    }


    if (songs.length === 0) {

        const empty =
            document.createElement(
                "li"
            );


        empty.className =
            "playlist-empty";


        empty.textContent =
            "No songs available";


        playlist.appendChild(
            empty
        );


        return;

    }


    songs.forEach(
        (song, index) => {

            const li =
                document.createElement(
                    "li"
                );


            /*
               ACTIVE
            */

            if (
                index === currentIndex
            ) {

                li.classList.add(
                    "active"
                );

            }


            /*
               COVER
            */

            const image =
                document.createElement(
                    "img"
                );


            image.src =
                getCoverURL(song);


            image.alt =
                song.title ||
                "Song";


            image.loading =
                "lazy";


            image.onerror =
                () => {

                    image.onerror =
                        null;

                    image.src =
                        DEFAULT_COVER;

                };


            /*
               DETAILS
            */

            const details =
                document.createElement(
                    "div"
                );


            details.className =
                "song-details";


            const songTitle =
                document.createElement(
                    "strong"
                );


            songTitle.textContent =
                song.title ||
                "Unknown Song";


            const songArtist =
                document.createElement(
                    "small"
                );


            songArtist.textContent =
                song.artist ||
                "Unknown Artist";


            details.appendChild(
                songTitle
            );


            details.appendChild(
                songArtist
            );


            /*
               PLAY ICON
            */

            const icon =
                document.createElement(
                    "i"
                );


            icon.className =
                index === currentIndex &&
                isPlaying

                    ? "fa-solid fa-volume-high"

                    : "fa-solid fa-music";


            /*
               BUILD
            */

            li.appendChild(
                image
            );


            li.appendChild(
                details
            );


            li.appendChild(
                icon
            );


            /*
               CLICK
            */

            li.addEventListener(
                "click",
                () => {

                    loadSong(
                        index
                    );


                    closePlaylistPanel();


                    playSong();

                }
            );


            playlist.appendChild(
                li
            );

        }
    );

}


/* =========================================================
   UPDATE ACTIVE PLAYLIST ITEM
========================================================= */

function updatePlaylistActive() {

    if (!playlist) {

        return;

    }


    const items =
        playlist.querySelectorAll(
            "li"
        );


    items.forEach(
        (item, index) => {

            item.classList.toggle(
                "active",
                index === currentIndex
            );

        }
    );

}


/* =========================================================
   SONG COUNT
========================================================= */

function updateSongCount() {

    if (!songCount) {

        return;

    }


    songCount.textContent =
        `${songs.length} Songs`;

}


/* =========================================================
   OPEN PLAYLIST
========================================================= */

function openPlaylist() {

    if (!playlistPanel) {

        return;

    }


    playlistPanel.classList.add(
        "open"
    );

}


/* =========================================================
   CLOSE PLAYLIST
========================================================= */

function closePlaylistPanel() {

    if (!playlistPanel) {

        return;

    }


    playlistPanel.classList.remove(
        "open"
    );

}


/* =========================================================
   MORE MENU
========================================================= */

function toggleMoreMenu(
    event
) {

    if (event) {

        event.stopPropagation();

    }


    if (!moreMenu) {

        return;

    }


    moreMenu.classList.toggle(
        "open"
    );

}


/* =========================================================
   CLOSE MORE
========================================================= */

function closeMoreMenu() {

    if (!moreMenu) {

        return;

    }


    moreMenu.classList.remove(
        "open"
    );

}


/* =========================================================
   OUTSIDE CLICK
========================================================= */

function handleOutsideClick(
    event
) {

    if (
        !moreMenu ||
        !moreBtn
    ) {

        return;

    }


    if (
        !moreMenu.contains(
            event.target
        ) &&
        !moreBtn.contains(
            event.target
        )
    ) {

        closeMoreMenu();

    }

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    if (!audio) {

        return;

    }


    if (
        !Number.isFinite(
            audio.duration
        ) ||
        audio.duration <= 0
    ) {

        return;

    }


    if (progress) {

        progress.min = 0;

        progress.max =
            audio.duration;

        progress.value =
            audio.currentTime;

    }


    if (currentTime) {

        currentTime.textContent =
            formatTime(
                audio.currentTime
            );

    }


    if (durationTime) {

        durationTime.textContent =
            formatTime(
                audio.duration
            );

    }


    updateMediaPosition();

}


/* =========================================================
   METADATA
========================================================= */

function handleMetadata() {

    if (!audio) {

        return;

    }


    if (durationTime) {

        durationTime.textContent =
            formatTime(
                audio.duration
            );

    }


    if (progress) {

        progress.min = 0;

        progress.max =
            Number.isFinite(
                audio.duration
            )
                ? audio.duration
                : 100;

    }


    updateMediaPosition();

}


/* =========================================================
   SEEK
========================================================= */

function seekAudio() {

    if (
        !audio ||
        !Number.isFinite(
            audio.duration
        )
    ) {

        return;

    }


    audio.currentTime =
        Number(
            progress.value
        );


    updateMediaPosition();

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
    seconds
) {

    if (
        !Number.isFinite(
            seconds
        ) ||
        seconds < 0
    ) {

        return "0:00";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    const secs =
        Math.floor(
            seconds % 60
        );


    return (
        `${minutes}:` +
        `${secs
            .toString()
            .padStart(2, "0")}`
    );

}


/* =========================================================
   AUDIO ERROR
========================================================= */

function handleAudioError(
    event
) {

    console.error(
        "Audio loading error:",
        event
    );


    console.error(
        "Audio source:",
        audio?.src
    );

}


/* =========================================================
   MEDIA SESSION METADATA
========================================================= */

async function updateMediaSession(
    song
) {

    if (
        !MediaSession ||
        !song
    ) {

        return;

    }


    try {

        const artworkURL =
            getCoverURL(song);


        /*
           Capacitor MediaSession
        */

        if (
            window.Capacitor &&
            window.Capacitor.Plugins &&
            window.Capacitor.Plugins.MediaSession ===
                MediaSession
        ) {

            await MediaSession.setMetadata({

                title:
                    song.title ||
                    "Unknown Song",

                artist:
                    song.artist ||
                    "Unknown Artist",

                album:
                    song.album ||
                    "Music Player",

                artwork: artworkURL
                    ? [
                        {
                            src:
                                artworkURL,

                            sizes:
                                "512x512",

                            type:
                                "image/jpeg"
                        }
                    ]
                    : []

            });


            return;

        }


        /*
           Browser MediaSession
        */

        if (
            "mediaSession" in navigator
        ) {

            navigator.mediaSession.metadata =
                new MediaMetadata({

                    title:
                        song.title ||
                        "Unknown Song",

                    artist:
                        song.artist ||
                        "Unknown Artist",

                    album:
                        song.album ||
                        "Music Player",

                    artwork:
                        artworkURL
                            ? [
                                {
                                    src:
                                        artworkURL,

                                    sizes:
                                        "512x512",

                                    type:
                                        "image/jpeg"
                                }
                            ]
                            : []

                });

        }

    } catch (error) {

        console.warn(
            "MediaSession metadata error:",
            error
        );

    }

}


/* =========================================================
   MEDIA SESSION PLAYBACK STATE
========================================================= */

async function updateMediaPlaybackState(
    state
) {

    if (!MediaSession) {

        return;

    }


    try {

        /*
           Capacitor
        */

        if (
            window.Capacitor &&
            window.Capacitor.Plugins &&
            window.Capacitor.Plugins.MediaSession ===
                MediaSession &&
            typeof MediaSession.setPlaybackState ===
                "function"
        ) {

            await MediaSession.setPlaybackState({

                playbackState:
                    state

            });


            return;

        }


        /*
           Browser
        */

        if (
            "mediaSession" in navigator
        ) {

            navigator.mediaSession.playbackState =
                state;

        }

    } catch (error) {

        console.warn(
            "MediaSession playback state error:",
            error
        );

    }

}


/* =========================================================
   MEDIA SESSION POSITION
========================================================= */

function updateMediaPosition() {

    if (
        !audio ||
        !MediaSession ||
        !Number.isFinite(
            audio.duration
        ) ||
        audio.duration <= 0
    ) {

        return;

    }


    try {

        /*
           Capacitor
        */

        if (
            window.Capacitor &&
            window.Capacitor.Plugins &&
            window.Capacitor.Plugins.MediaSession ===
                MediaSession &&
            typeof MediaSession.setPositionState ===
                "function"
        ) {

            MediaSession
                .setPositionState({

                    duration:
                        audio.duration,

                    playbackRate:
                        audio.playbackRate ||
                        1,

                    position:
                        audio.currentTime

                })
                .catch(
                    () => {}
                );


            return;

        }


        /*
           Browser

           Browser MediaSession
           does not require
           manual position state
           updates in all browsers.
        */

    } catch (error) {

        console.warn(
            "MediaSession position error:",
            error
        );

    }

}


/* =========================================================
   SETUP MEDIA SESSION ACTIONS
========================================================= */

async function setupMediaSession() {

    if (!MediaSession) {

        return;

    }


    try {

        /*
           Capacitor MediaSession
        */

        if (
            window.Capacitor &&
            window.Capacitor.Plugins &&
            window.Capacitor.Plugins.MediaSession ===
                MediaSession &&
            typeof MediaSession.setActionHandler ===
                "function"
        ) {


            await MediaSession.setActionHandler(
                {
                    action: "play"
                },
                () => playSong()
            );


            await MediaSession.setActionHandler(
                {
                    action: "pause"
                },
                () => pauseSong()
            );


            await MediaSession.setActionHandler(
                {
                    action: "previoustrack"
                },
                () => prevSong()
            );


            await MediaSession.setActionHandler(
                {
                    action: "nexttrack"
                },
                () => nextSong()
            );


            console.log(
                "Native MediaSession ready"
            );


            return;

        }


        /*
           Browser MediaSession API
        */

        if (
            "mediaSession" in navigator
        ) {

            try {

                navigator.mediaSession.setActionHandler(
                    "play",
                    () => playSong()
                );

            } catch (error) {}


            try {

                navigator.mediaSession.setActionHandler(
                    "pause",
                    () => pauseSong()
                );

            } catch (error) {}


            try {

                navigator.mediaSession.setActionHandler(
                    "previoustrack",
                    () => prevSong()
                );

            } catch (error) {}


            try {

                navigator.mediaSession.setActionHandler(
                    "nexttrack",
                    () => nextSong()
                );

            } catch (error) {}


            console.log(
                "Browser MediaSession ready"
            );

        }

    } catch (error) {

        console.warn(
            "MediaSession setup error:",
            error
        );

    }

}


/* =========================================================
   LYRICS
========================================================= */

function toggleLyrics() {

    if (!lyricsPanel) {

        return;

    }


    lyricsPanel.classList.toggle(
        "open"
    );

}


/* =========================================================
   PLAYER VIEW
========================================================= */

function setPlayerView(
    view
) {

    if (
        view === "lyrics"
    ) {

        if (lyricsPanel) {

            lyricsPanel.classList.add(
                "open"
            );

        }


        if (coverTab) {

            coverTab.classList.remove(
                "active"
            );

        }


        if (lyricTab) {

            lyricTab.classList.add(
                "active"
            );

        }

    } else {

        if (lyricsPanel) {

            lyricsPanel.classList.remove(
                "open"
            );

        }


        if (coverTab) {

            coverTab.classList.add(
                "active"
            );

        }


        if (lyricTab) {

            lyricTab.classList.remove(
                "active"
            );

        }

    }

}


/* =========================================================
   EMPTY PLAYER
========================================================= */

function showEmptyPlayer() {

    if (title) {

        title.textContent =
            "No Songs Available";

    }


    if (artist) {

        artist.textContent =
            "Upload a song first";

    }


    if (cover) {

        cover.src =
            DEFAULT_COVER;

    }


    if (audio) {

        audio.pause();

        audio.removeAttribute(
            "src"
        );

        audio.load();

    }


    if (currentTime) {

        currentTime.textContent =
            "0:00";

    }


    if (durationTime) {

        durationTime.textContent =
            "0:00";

    }


    if (progress) {

        progress.value = 0;

    }

}


/* =========================================================
   PLAYER ERROR
========================================================= */

function showPlayerError(
    message
) {

    if (title) {

        title.textContent =
            message;

    }


    if (artist) {

        artist.textContent =
            "Please try again later";

    }


    if (cover) {

        cover.src =
            DEFAULT_COVER;

    }


    if (audio) {

        audio.pause();

        audio.removeAttribute(
            "src"
        );

        audio.load();

    }

}


/* =========================================================
   DEBUG INFORMATION
========================================================= */

console.log(
    "Music Player V2 loaded"
);
