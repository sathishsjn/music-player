 
// =====================================
// MUSIC PLAYER PAGE
// =====================================

const API_URL =
    "http://localhost:5000";

let songs = [];

let currentSong = 0;

let isPlaying = false;


// =====================================
// ELEMENTS
// =====================================

const audio =
    document.getElementById("audio");

const cover =
    document.getElementById("cover");

const title =
    document.getElementById("title");

const artist =
    document.getElementById("artist");

const playBtn =
    document.getElementById("play");

const playIcon =
    document.getElementById("playIcon");

const prevBtn =
    document.getElementById("prev");

const nextBtn =
    document.getElementById("next");

const progress =
    document.getElementById("progress");

const current =
    document.getElementById("current");

const duration =
    document.getElementById("duration");

const playlist =
    document.getElementById("playlist");

const songCount =
    document.getElementById("songCount");


// =====================================
// DEFAULT COVER
// =====================================

const DEFAULT_COVER =
    "assets/images/cover8.jpg";


// =====================================
// LOAD SONGS
// =====================================

async function loadSongs() {

    try {

        const response =
            await fetch(
                `${API_URL}/api/songs`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load songs"
            );

        }


        const data =
            await response.json();


        songs =
            data.songs || [];


        console.log(
            "Player songs:",
            songs
        );


        if (!songs.length) {

            title.textContent =
                "No Songs Available";

            artist.textContent =
                "Upload a song first";

            return;

        }


        // =================================
        // SELECT SONG FROM URL
        // =================================

        const params =
            new URLSearchParams(
                window.location.search
            );


        const songId =
            params.get("id");


        if (songId) {

            const foundIndex =
                songs.findIndex(
                    (song) =>
                        String(song.id) ===
                        String(songId)
                );


            if (foundIndex !== -1) {

                currentSong =
                    foundIndex;

            }

        }


        loadSong(
            currentSong
        );


        createPlaylist();


    } catch (error) {

        console.error(
            "Player error:",
            error
        );


        title.textContent =
            "Unable to load songs";

        artist.textContent =
            "Check backend connection";

    }

}


// =====================================
// LOAD SONG
// =====================================

function loadSong(index) {

    if (!songs[index]) return;


    const song =
        songs[index];


    // AUDIO

    audio.src =
        API_URL +
        song.audio_url;


    // COVER

    cover.src =
        song.cover_url
            ? API_URL +
              song.cover_url
            : DEFAULT_COVER;


    // TITLE

    title.textContent =
        song.title ||
        "Unknown Song";


    // ARTIST

    artist.textContent =
        song.artist ||
        "Unknown Artist";


    // RESET

    progress.value = 0;

    current.textContent =
        "0:00";

    duration.textContent =
        "0:00";


    document.title =
        `${song.title || "Music Player"} | Music Player`;


    updateButton();

}


// =====================================
// PLAY
// =====================================

async function playSong() {

    if (!songs.length) return;


    try {

        await audio.play();

        isPlaying = true;

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

function pauseSong() {

    audio.pause();

    isPlaying = false;

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

    if (!playIcon) return;


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

    if (!songs.length) return;


    currentSong++;


    if (
        currentSong >=
        songs.length
    ) {

        currentSong = 0;

    }


    loadSong(
        currentSong
    );


    playSong();

}


// =====================================
// PREVIOUS
// =====================================

function prevSong() {

    if (!songs.length) return;


    currentSong--;


    if (currentSong < 0) {

        currentSong =
            songs.length - 1;

    }


    loadSong(
        currentSong
    );


    playSong();

}


// =====================================
// BUTTONS
// =====================================

if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        nextSong
    );

}


if (prevBtn) {

    prevBtn.addEventListener(
        "click",
        prevSong
    );

}


// =====================================
// TIME UPDATE
// =====================================

audio.addEventListener(
    "timeupdate",
    () => {

        if (
            !isNaN(audio.duration)
        ) {

            progress.max =
                audio.duration;


            progress.value =
                audio.currentTime;


            current.textContent =
                formatTime(
                    audio.currentTime
                );


            duration.textContent =
                formatTime(
                    audio.duration
                );

        }

    }
);


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
        Math.floor(
            time / 60
        );


    let seconds =
        Math.floor(
            time % 60
        );


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

            audio.currentTime =
                Number(
                    progress.value
                );

        }
    );

}


// =====================================
// PLAYLIST
// =====================================

function createPlaylist() {

    if (!playlist) return;


    playlist.innerHTML = "";


    if (songCount) {

        songCount.textContent =
            `${songs.length} Songs`;

    }


    songs.forEach(
        (song, index) => {

            const li =
                document.createElement(
                    "li"
                );


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

                    currentSong =
                        index;


                    loadSong(
                        currentSong
                    );


                    playSong();

                }
            );


            playlist.appendChild(
                li
            );

        }
    );

}


// =====================================
// AUDIO EVENTS
// =====================================

audio.addEventListener(
    "play",
    () => {

        isPlaying = true;

        updateButton();

    }
);


audio.addEventListener(
    "pause",
    () => {

        isPlaying = false;

        updateButton();

    }
);


audio.addEventListener(
    "ended",
    () => {

        nextSong();

    }
);


// =====================================
// START
// =====================================

loadSongs();

