// =====================================
// MUSIC PLAYER
// =====================================

let songs = [];
let currentSong = 0;
let isPlaying = false;

// =====================================
// API
// =====================================

const API_URL = "https://music-player-api.onrender.com";

// =====================================
// ELEMENTS
// =====================================

const audio = document.getElementById("audio");
const cover = document.getElementById("cover");
const title = document.getElementById("title");
const artist = document.getElementById("artist");

const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const playIcon = document.getElementById("playIcon");

const progress = document.getElementById("progress");

const current = document.getElementById("current");
const duration = document.getElementById("duration");

const playlist = document.getElementById("playlist");

const songGrid = document.getElementById("songGrid");

const searchInput = document.getElementById("search");

const heroPlay = document.getElementById("heroPlay");

// =====================================
// DEFAULT COVER
// =====================================

const DEFAULT_COVER = "assets/images/cover8.jpg";

// =====================================
// LOAD SONGS FROM MYSQL
// =====================================

async function loadSongs() {
  try {
    showLoading();

    const response = await fetch(`${API_URL}/api/songs`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    console.log("Songs from MySQL:", data);

    songs = data.songs || [];

    if (songs.length === 0) {
      showEmptyMessage();

      return;
    }

    console.log("Songs loaded successfully:", songs);

    // Load first song

    currentSong = 0;

    loadSong(currentSong);

    // Create UI

    createPlaylist();

    loadTrendingSongs(songs);
  } catch (error) {
    console.error("Error loading songs:", error);

    showError("Unable to load songs. Please check your backend.");
  }
}

// =====================================
// SHOW LOADING
// =====================================

function showLoading() {
  if (!songGrid) return;

  songGrid.innerHTML = `

        <div class="loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Loading songs...
            </span>

        </div>

    `;
}

// =====================================
// SHOW EMPTY
// =====================================

function showEmptyMessage() {
  if (!songGrid) return;

  songGrid.innerHTML = `

        <div class="loading">

            <i class="fa-solid fa-music"></i>

            <span>
                No songs available
            </span>

        </div>

    `;
}

// =====================================
// SHOW ERROR
// =====================================

function showError(message) {
  if (!songGrid) return;

  songGrid.innerHTML = `

        <div class="loading">

            <i class="fa-solid fa-circle-exclamation"></i>

            <span>
                ${message}
            </span>

        </div>

    `;
}

// =====================================
// LOAD CURRENT SONG
// =====================================

function loadSong(index) {
  if (!songs[index]) return;

  if (!audio) return;

  const song = songs[index];

  // =================================
  // AUDIO
  // =================================

  if (song.audio_url) {
    audio.src = API_URL + song.audio_url;
  }

  // =================================
  // COVER
  // =================================

  if (cover) {
    cover.src = song.cover_url ? API_URL + song.cover_url : DEFAULT_COVER;
  }

  // =================================
  // TITLE
  // =================================

  if (title) {
    title.textContent = song.title || "Unknown Song";
  }

  // =================================
  // ARTIST
  // =================================

  if (artist) {
    artist.textContent = song.artist || "Unknown Artist";
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
  // BROWSER TITLE
  // =================================

  document.title = `${song.title || "Music Player"} | Music Player`;

  updatePlayButton();
}

// =====================================
// PLAY SONG
// =====================================

async function playSong() {
  if (!songs.length) return;

  if (!audio) return;

  try {
    await audio.play();

    isPlaying = true;

    updatePlayButton();
  } catch (error) {
    console.error("Playback error:", error);
  }
}

// =====================================
// PAUSE SONG
// =====================================

function pauseSong() {
  if (!audio) return;

  audio.pause();

  isPlaying = false;

  updatePlayButton();
}

// =====================================
// PLAY / PAUSE
// =====================================

function togglePlay() {
  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
}

// =====================================
// UPDATE PLAY ICON
// =====================================

function updatePlayButton() {
  if (!playIcon) return;

  if (isPlaying) {
    playIcon.className = "fa-solid fa-pause";
  } else {
    playIcon.className = "fa-solid fa-play";
  }
}

// =====================================
// MAIN PLAY BUTTON
// =====================================

if (playBtn) {
  playBtn.addEventListener("click", togglePlay);
}

// =====================================
// HERO PLAY BUTTON
// =====================================

if (heroPlay) {
  heroPlay.addEventListener("click", () => {
    if (!songs.length) {
      alert("No songs available");

      return;
    }

    localStorage.setItem("selectedSong", JSON.stringify(songs[0]));

    localStorage.setItem("allSongs", JSON.stringify(songs));

    localStorage.setItem("currentSongIndex", "0");

    window.location.href =
      songs[0]?.id !== undefined
        ? `player.html?id=${encodeURIComponent(songs[0].id)}`
        : "player.html";
  });
}

// =====================================
// NEXT SONG
// =====================================

function nextSong() {
  if (!songs.length) return;

  currentSong++;

  if (currentSong >= songs.length) {
    currentSong = 0;
  }

  loadSong(currentSong);

  playSong();
}

// =====================================
// PREVIOUS SONG
// =====================================

function prevSong() {
  if (!songs.length) return;

  currentSong--;

  if (currentSong < 0) {
    currentSong = songs.length - 1;
  }

  loadSong(currentSong);

  playSong();
}

// =====================================
// NEXT BUTTON
// =====================================

if (nextBtn) {
  nextBtn.addEventListener("click", nextSong);
}

// =====================================
// PREVIOUS BUTTON
// =====================================

if (prevBtn) {
  prevBtn.addEventListener("click", prevSong);
}

// =====================================
// AUDIO TIME UPDATE
// =====================================

if (audio) {
  audio.addEventListener("timeupdate", () => {
    if (!isNaN(audio.duration) && audio.duration > 0) {
      if (progress) {
        progress.max = audio.duration;

        progress.value = audio.currentTime;
      }

      if (current) {
        current.textContent = formatTime(audio.currentTime);
      }

      if (duration) {
        duration.textContent = formatTime(audio.duration);
      }
    }
  });
}

// =====================================
// AUDIO LOADED
// =====================================

if (audio) {
  audio.addEventListener("loadedmetadata", () => {
    if (duration && !isNaN(audio.duration)) {
      duration.textContent = formatTime(audio.duration);
    }
  });
}

// =====================================
// FORMAT TIME
// =====================================

function formatTime(time) {
  if (isNaN(time) || time < 0) {
    return "0:00";
  }

  const minutes = Math.floor(time / 60);

  let seconds = Math.floor(time % 60);

  if (seconds < 10) {
    seconds = "0" + seconds;
  }

  return `${minutes}:${seconds}`;
}

// =====================================
// PROGRESS BAR
// =====================================

if (progress) {
  progress.addEventListener("input", () => {
    if (!audio) return;

    audio.currentTime = Number(progress.value);
  });
}

// =====================================
// CREATE PLAYLIST
// =====================================

function createPlaylist() {
  if (!playlist) return;

  playlist.innerHTML = "";

  songs.forEach((song, index) => {
    const li = document.createElement("li");

    li.innerHTML = `

                <i class="fa-solid fa-music"></i>

                <span>
                    ${song.title || "Unknown Song"}
                    -
                    ${song.artist || "Unknown Artist"}
                </span>

            `;

    li.addEventListener("click", () => {
      currentSong = index;

      loadSong(currentSong);

      playSong();
    });

    playlist.appendChild(li);
  });
}

// =====================================
// TRENDING SONGS
// =====================================

function loadTrendingSongs(songList = songs) {
  if (!songGrid) return;

  songGrid.innerHTML = "";

  if (!songList || songList.length === 0) {
    showEmptyMessage();

    return;
  }

  songList.forEach((song) => {
    const realIndex = songs.indexOf(song);

    const card = document.createElement("div");

    card.className = "song-card";

    const coverUrl = song.cover_url ? API_URL + song.cover_url : DEFAULT_COVER;

    card.innerHTML = `

                <img
                    src="${coverUrl}"
                    alt="${song.title || "Song"}"
                    loading="lazy"
                >


                <h3>
                    ${song.title || "Unknown Song"}
                </h3>


                <p>
                    ${song.artist || "Unknown Artist"}
                </p>


                <button
                    type="button"
                >

                    <i class="fa-solid fa-play"></i>

                    Play

                </button>

            `;

    const button = card.querySelector("button");

    if (button) {
      button.addEventListener("click", (event) => {
        event.stopPropagation();

        playTrending(realIndex);
      });
    }

    card.addEventListener("click", () => {
      playTrending(realIndex);
    });

    songGrid.appendChild(card);
  });
}

// =====================================
// PLAY TRENDING SONG
// =====================================

function playTrending(index) {
  if (!songs[index]) return;

  const song = songs[index];

  // Save selected song
  localStorage.setItem("selectedSong", JSON.stringify(song));

  // Save all songs
  localStorage.setItem("allSongs", JSON.stringify(songs));

  // Save selected index
  localStorage.setItem("currentSongIndex", index);

  console.log("Opening player:", song);

  // Open player page
  window.location.href =
    song?.id !== undefined
      ? `player.html?id=${encodeURIComponent(song.id)}`
      : "player.html";
}

// =====================================
// SEARCH SONGS
// =====================================

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const searchText = searchInput.value.toLowerCase().trim();

    if (!searchText) {
      loadTrendingSongs(songs);

      return;
    }

    const filteredSongs = songs.filter((song) => {
      const title = (song.title || "").toLowerCase();

      const artist = (song.artist || "").toLowerCase();

      const album = (song.album || "").toLowerCase();

      return (
        title.includes(searchText) ||
        artist.includes(searchText) ||
        album.includes(searchText)
      );
    });

    loadTrendingSongs(filteredSongs);
  });
}

// =====================================
// SONG ENDED
// =====================================

if (audio) {
  audio.addEventListener("ended", () => {
    isPlaying = false;

    updatePlayButton();

    nextSong();
  });
}

// =====================================
// AUDIO PLAY EVENT
// =====================================

if (audio) {
  audio.addEventListener("play", () => {
    isPlaying = true;

    updatePlayButton();
  });
}

// =====================================
// AUDIO PAUSE EVENT
// =====================================

if (audio) {
  audio.addEventListener("pause", () => {
    isPlaying = false;

    updatePlayButton();
  });
}

// =====================================
// SERVICE WORKER
// =====================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")

      .then((registration) => {
        console.log("Service Worker enabled:", registration.scope);
      })

      .catch((error) => {
        // Don't break the music player
        // if service-worker.js doesn't exist

        console.warn("Service Worker unavailable:", error.message);
      });
  });
}

// =====================================
// START MUSIC PLAYER
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  loadSongs();
});
