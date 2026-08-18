// =====================================
// MUSIC PLAYER PAGE
// =====================================

const API_URL = "https://music-player-0qp9.onrender.com";

let songs = [];
let currentSong = 0;
let isPlaying = false;

// =====================================
// ELEMENTS
// =====================================

const audio = document.getElementById("audio");
const cover = document.getElementById("cover");
const title = document.getElementById("title");
const artist = document.getElementById("artist");
const playBtn = document.getElementById("play");
const playIcon = document.getElementById("playIcon");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const progress = document.getElementById("progress");
const current = document.getElementById("current");
const duration = document.getElementById("duration");
const playlist = document.getElementById("playlist");
const songCount = document.getElementById("songCount");

// =====================================
// DEFAULT COVER
// =====================================

const DEFAULT_COVER = "assets/images/cover8.jpg";

// =====================================
// MEDIA SESSION PLUGIN
// =====================================

const MediaSession =
    window.Capacitor?.Plugins?.MediaSession || null;

// =====================================
// PARSE LOCAL STORAGE
// =====================================

function parseSavedItem(key) {
    try {
        return JSON.parse(localStorage.getItem(key));
    } catch {
        return null;
    }
}

// =====================================
// ERROR
// =====================================

function showError(message) {
    console.error(message);

    if (title) {
        title.textContent = "Error loading player";
    }

    if (artist) {
        artist.textContent = "Please refresh or try again";
    }
}

// =====================================
// GET SAVED SONG
// =====================================

function getSavedSongIndex() {
    const savedIndex = Number(
        localStorage.getItem("currentSongIndex")
    );

    const selectedSong = parseSavedItem("selectedSong");

    if (
        Number.isInteger(savedIndex) &&
        savedIndex >= 0 &&
        savedIndex < songs.length &&
        selectedSong &&
        String(songs[savedIndex]?.id) ===
            String(selectedSong.id)
    ) {
        return savedIndex;
    }

    if (selectedSong && selectedSong.id) {
        const foundIndex = songs.findIndex(
            (song) =>
                String(song.id) ===
                String(selectedSong.id)
        );

        if (foundIndex !== -1) {
            return foundIndex;
        }
    }

    return -1;
}

// =====================================
// LOAD SONGS
// =====================================

async function loadSongs() {
    try {
        console.log("Loading songs...");

        const response = await fetch(
            `${API_URL}/api/songs`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to load songs (${response.status})`
            );
        }

        const data = await response.json();

        console.log("Backend response:", data);

        songs = data.songs || [];

        console.log("Player songs:", songs);

        // =================================
        // SONG COUNT
        // =================================

        if (songCount) {
            songCount.textContent =
                `${songs.length} Songs`;
        }

        // =================================
        // NO SONGS
        // =================================

        if (!songs.length) {
            if (title) {
                title.textContent = "No Songs Available";
            }

            if (artist) {
                artist.textContent =
                    "Upload a song first";
            }

            if (audio) {
                audio.removeAttribute("src");
            }

            if (cover) {
                cover.src = DEFAULT_COVER;
            }

            createPlaylist();

            return;
        }

        // =================================
        // URL SONG
        // =================================

        const params =
            new URLSearchParams(window.location.search);

        const songId = params.get("id");

        let selectedIndex = -1;

        if (songId) {
            selectedIndex = songs.findIndex(
                (song) =>
                    String(song.id) ===
                    String(songId)
            );

            if (selectedIndex === -1) {
                if (title) {
                    title.textContent =
                        "Song not found";
                }

                if (artist) {
                    artist.textContent =
                        "Please select a valid song";
                }

                if (audio) {
                    audio.removeAttribute("src");
                }

                if (cover) {
                    cover.src = DEFAULT_COVER;
                }

                createPlaylist();

                return;
            }
        } else {
            selectedIndex = getSavedSongIndex();
        }

        // =================================
        // SELECT CURRENT SONG
        // =================================

        currentSong =
            selectedIndex !== -1
                ? selectedIndex
                : 0;

        loadSong(currentSong);

        createPlaylist();

    } catch (error) {
        console.error(
            "Player error:",
            error
        );

        if (title) {
            title.textContent =
                "Unable to load songs";
        }

        if (artist) {
            artist.textContent =
                "Please try again later";
        }

        if (audio) {
            audio.removeAttribute("src");
        }

        if (cover) {
            cover.src = DEFAULT_COVER;
        }

        showError(
            "Unable to load songs. Please check your backend."
        );
    }
}

// =====================================
// LOAD SONG
// =====================================

function loadSong(index) {
    if (!songs[index]) {
        console.error(
            "Song not found:",
            index
        );
        return;
    }

    const song = songs[index];

    console.log(
        "Loading song:",
        song
    );

    // =================================
    // AUDIO
    // =================================

    if (audio) {
        if (song.audio_url) {

            const audioURL =
                song.audio_url.startsWith("http")
                    ? song.audio_url
                    : API_URL + song.audio_url;

            console.log(
                "Audio URL:",
                audioURL
            );

            audio.src = audioURL;

            audio.load();

        } else {
            audio.removeAttribute("src");
        }
    }

    // =================================
    // COVER
    // =================================

    if (cover) {

        if (song.cover_url) {

            cover.src =
                song.cover_url.startsWith("http")
                    ? song.cover_url
                    : API_URL + song.cover_url;

        } else {

            cover.src = DEFAULT_COVER;
        }
    }

    // =================================
    // TITLE
    // =================================

    if (title) {
        title.textContent =
            song.title || "Unknown Song";
    }

    // =================================
    // ARTIST
    // =================================

    if (artist) {
        artist.textContent =
            song.artist || "Unknown Artist";
    }

    // =================================
    // RESET PROGRESS
    // =================================

    if (progress) {
        progress.value = 0;
        progress.max = 100;
    }

    if (current) {
        current.textContent = "0:00";
    }

    if (duration) {
        duration.textContent = "0:00";
    }

    // =================================
    // PAGE TITLE
    // =================================

    document.title =
        `${song.title || "Music Player"} | Music Player`;

    // =================================
    // SAVE CURRENT SONG
    // =================================

    localStorage.setItem(
        "currentSongIndex",
        currentSong
    );

    localStorage.setItem(
        "selectedSong",
        JSON.stringify(song)
    );

    // =================================
    // MEDIA SESSION
    // =================================

    updateMediaSession(song);

    updateButton();
}

// =====================================
// MEDIA SESSION METADATA
// =====================================

async function updateMediaSession(song) {

    if (!MediaSession) {
        return;
    }

    try {

        let artwork = [];

        if (song.cover_url) {

            const coverURL =
                song.cover_url.startsWith("http")
                    ? song.cover_url
                    : API_URL + song.cover_url;

            artwork = [
                {
                    src: coverURL,
                    sizes: "512x512",
                    type: "image/jpeg"
                }
            ];
        }

        await MediaSession.setMetadata({
            title:
                song.title ||
                "Unknown Song",

            artist:
                song.artist ||
                "Unknown Artist",

            album: "Music Player",

            artwork: artwork
        });

        console.log(
            "MediaSession metadata updated"
        );

    } catch (error) {

        console.error(
            "MediaSession metadata error:",
            error
        );
    }
}

// =====================================
// PLAY
// =====================================

async function playSong() {

    if (!songs.length || !audio) {
        return;
    }

    try {

        await audio.play();

        isPlaying = true;

        if (MediaSession) {

            await MediaSession.setPlaybackState({
                playbackState: "playing"
            });
        }

        updateButton();

    } catch (error) {

        console.error(
            "Play error:",
            error
        );
    }
}

// =====================================
// PAUSE
// =====================================

async function pauseSong() {

    if (!audio) {
        return;
    }

    audio.pause();

    isPlaying = false;

    if (MediaSession) {

        try {

            await MediaSession.setPlaybackState({
                playbackState: "paused"
            });

        } catch (error) {

            console.error(
                "MediaSession pause error:",
                error
            );
        }
    }

    updateButton();
}

// =====================================
// PLAY BUTTON
// =====================================

if (playBtn) {

    playBtn.addEventListener(
        "click",
        () => {

            if (isPlaying) {
                pauseSong();
            } else {
                playSong();
            }

        }
    );
}

// =====================================
// UPDATE BUTTON
// =====================================

function updateButton() {

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

// =====================================
// NEXT
// =====================================

function nextSong() {

    if (!songs.length) {
        return;
    }

    currentSong++;

    if (currentSong >= songs.length) {
        currentSong = 0;
    }

    loadSong(currentSong);

    playSong();
}

// =====================================
// PREVIOUS
// =====================================

function prevSong() {

    if (!songs.length) {
        return;
    }

    currentSong--;

    if (currentSong < 0) {
        currentSong =
            songs.length - 1;
    }

    loadSong(currentSong);

    playSong();
}

// =====================================
// NEXT BUTTON
// =====================================

if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        nextSong
    );
}

// =====================================
// PREVIOUS BUTTON
// =====================================

if (prevBtn) {

    prevBtn.addEventListener(
        "click",
        prevSong
    );
}

// =====================================
// MEDIA SESSION CONTROLS
// =====================================

async function setupMediaSession() {

    if (!MediaSession) {

        console.warn(
            "MediaSession plugin not available"
        );

        return;
    }

    try {

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

    } catch (error) {

        console.error(
            "MediaSession setup error:",
            error
        );
    }
}

// =====================================
// TIME UPDATE
// =====================================

if (audio) {

    audio.addEventListener(
        "timeupdate",
        () => {

            if (!isNaN(audio.duration)) {

                if (progress) {

                    progress.max =
                        audio.duration;

                    progress.value =
                        audio.currentTime;
                }

                if (current) {

                    current.textContent =
                        formatTime(
                            audio.currentTime
                        );
                }

                if (duration) {

                    duration.textContent =
                        formatTime(
                            audio.duration
                        );
                }

                // =========================
                // MEDIA SESSION POSITION
                // =========================

                if (
                    MediaSession &&
                    audio.duration > 0
                ) {

                    MediaSession
                        .setPositionState({

                            duration:
                                audio.duration,

                            playbackRate:
                                audio.playbackRate || 1,

                            position:
                                audio.currentTime

                        })
                        .catch(() => {});
                }
            }
        }
    );
}

// =====================================
// FORMAT TIME
// =====================================

function formatTime(time) {

    if (
        isNaN(time) ||
        time < 0
    ) {

        return "0:00";
    }

    const minutes =
        Math.floor(time / 60);

    let seconds =
        Math.floor(time % 60);

    if (seconds < 10) {

        seconds =
            "0" + seconds;
    }

    return `${minutes}:${seconds}`;
}

// =====================================
// PROGRESS
// =====================================

if (progress) {

    progress.addEventListener(
        "input",
        () => {

            if (audio) {

                audio.currentTime =
                    Number(
                        progress.value
                    );
            }
        }
    );
}

// =====================================
// PLAYLIST
// =====================================

function createPlaylist() {

    if (!playlist) {
        return;
    }

    playlist.innerHTML = "";

    if (songCount) {

        songCount.textContent =
            `${songs.length} Songs`;
    }

    songs.forEach(
        (song, index) => {

            const li =
                document.createElement("li");

            li.innerHTML = `

                <i class="fa-solid fa-music"></i>

                <span>
                    ${song.title || "Unknown Song"}
                    -
                    ${song.artist || "Unknown Artist"}
                </span>

            `;

            li.addEventListener(
                "click",
                () => {

                    currentSong = index;

                    loadSong(currentSong);

                    playSong();
                }
            );

            playlist.appendChild(li);
        }
    );
}

// =====================================
// AUDIO PLAY EVENT
// =====================================

if (audio) {

    audio.addEventListener(
        "play",
        () => {

            isPlaying = true;

            updateButton();

            if (MediaSession) {

                MediaSession
                    .setPlaybackState({
                        playbackState:
                            "playing"
                    })
                    .catch(() => {});
            }
        }
    );

    // =================================
    // AUDIO PAUSE EVENT
    // =================================

    audio.addEventListener(
        "pause",
        () => {

            isPlaying = false;

            updateButton();

            if (MediaSession) {

                MediaSession
                    .setPlaybackState({
                        playbackState:
                            "paused"
                    })
                    .catch(() => {});
            }
        }
    );

    // =================================
    // AUDIO ENDED
    // =================================

    audio.addEventListener(
        "ended",
        () => {

            nextSong();
        }
    );

    // =================================
    // AUDIO ERROR
    // =================================

    audio.addEventListener(
        "error",
        (event) => {

            console.error(
                "Audio loading error:",
                event
            );

            console.error(
                "Audio source:",
                audio.src
            );
        }
    );
}

// =====================================
// START
// =====================================

console.log(
    "Music Player JS loaded"
);

setupMediaSession();

loadSongs();

