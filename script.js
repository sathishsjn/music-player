/* =========================================================
   MUSIC PLAYER V2
   INDEX PAGE PLAYER
========================================================= */

/* =========================================================
   API
========================================================= */

const API_URL = "https://music-player-0qp9.onrender.com";

/* =========================================================
   STATE
========================================================= */

let songs = [];

let currentSong = 0;

let isPlaying = false;

/* =========================================================
   DEFAULT COVER
========================================================= */

const DEFAULT_COVER = "assets/images/cover8.jpg";

/* =========================================================
   ELEMENTS
========================================================= */

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

const clearSearch = document.getElementById("clearSearch");

const heroPlay = document.getElementById("heroPlay");

const songTotal = document.getElementById("songTotal");

const noResults = document.getElementById("noResults");

const openPlayer = document.getElementById("openPlayer");

/* =========================================================
   SAFE URL BUILDER
========================================================= */

function buildUrl(path) {
  if (!path) {
    return "";
  }

  /*
   * Already full URL
   */

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  /*
   * Local asset
   */

  if (path.startsWith("./") || path.startsWith("assets/")) {
    return path;
  }

  /*
   * Backend URL
   */

  return API_URL + path;
}

/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */

function normalizeSongs(data) {
  /*
   * API directly returns:
   *
   * [
   *   {...},
   *   {...}
   * ]
   */

  if (Array.isArray(data)) {
    return data;
  }

  /*
   * API returns:
   *
   * {
   *   songs: [...]
   * }
   */

  if (data && Array.isArray(data.songs)) {
    return data.songs;
  }

  /*
   * API returns:
   *
   * {
   *   data: [...]
   * }
   */

  if (data && Array.isArray(data.data)) {
    return data.data;
  }

  /*
   * API returns:
   *
   * {
   *   data: {
   *      songs: [...]
   *   }
   * }
   */

  if (data && data.data && Array.isArray(data.data.songs)) {
    return data.data.songs;
  }

  console.warn("Unexpected songs response:", data);

  return [];
}

/* =========================================================
   LOAD SONGS
========================================================= */

async function loadSongs() {
  try {
    showLoading();

    const response = await fetch(`${API_URL}/api/songs`, {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    console.log("API response:", data);

    songs = normalizeSongs(data);

    console.log("Normalized songs:", songs);

    if (!Array.isArray(songs)) {
      throw new Error("Songs data is not an array");
    }

    updateSongTotal();

    if (songs.length === 0) {
      showEmptyMessage();

      createPlaylist();

      return;
    }

    /*
     * Restore previous song
     */

    restoreSavedSong();

    /*
     * Render UI
     */

    renderSongs(songs);

    createPlaylist();
  } catch (error) {
    console.error("Error loading songs:", error);

    showError("Unable to load songs. Please check your backend.");
  }
}

/* =========================================================
   LOADING UI
========================================================= */

function showLoading() {
  if (!songGrid) {
    return;
  }

  songGrid.innerHTML = `
        <div class="loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Loading songs...
            </span>

        </div>
    `;

  if (noResults) {
    noResults.hidden = true;
  }
}

/* =========================================================
   EMPTY UI
========================================================= */

function showEmptyMessage() {
  if (!songGrid) {
    return;
  }

  songGrid.innerHTML = `
        <div class="loading">

            <i class="fa-solid fa-music"></i>

            <span>
                No songs available
            </span>

        </div>
    `;
}

/* =========================================================
   ERROR UI
========================================================= */

function showError(message) {
  if (!songGrid) {
    return;
  }

  songGrid.innerHTML = `
        <div class="loading">

            <i class="fa-solid fa-circle-exclamation"></i>

            <span>
                ${message}
            </span>

        </div>
    `;
}

/* =========================================================
   SONG COUNT
========================================================= */

function updateSongTotal() {
  if (!songTotal) {
    return;
  }

  songTotal.textContent = `${songs.length} ${
    songs.length === 1 ? "song" : "songs"
  }`;
}

/* =========================================================
   SAVE PLAYBACK POSITION
========================================================= */

function savePlaybackPosition() {
  if (!audio) {
    return;
  }

  try {
    const time = Number(audio.currentTime);

    if (!isNaN(time) && time >= 0) {
      localStorage.setItem(
        "currentPlaybackTime",
        String(time)
      );
    }
  } catch (error) {
    console.warn(
      "Unable to save playback position:",
      error
    );
  }
}

/* =========================================================
   RESTORE SAVED SONG
========================================================= */

function restoreSavedSong() {
  try {
    const savedIndex =
      localStorage.getItem("currentSongIndex");

    const savedSong =
      localStorage.getItem("selectedSong");

    if (
      savedIndex !== null &&
      !isNaN(Number(savedIndex))
    ) {
      const index = Number(savedIndex);

      if (
        index >= 0 &&
        index < songs.length
      ) {
        currentSong = index;

        loadSong(currentSong, false);

        return;
      }
    }

    /*
     * Try matching saved song ID
     */

    if (savedSong) {
      const parsed = JSON.parse(savedSong);

      const index = songs.findIndex(
        (song) =>
          String(song.id) ===
          String(parsed.id)
      );

      if (index >= 0) {
        currentSong = index;

        loadSong(currentSong, false);

        return;
      }
    }

    /*
     * Default first song
     */

    currentSong = 0;

    loadSong(currentSong, false);
  } catch (error) {
    console.warn(
      "Unable to restore saved song:",
      error
    );

    currentSong = 0;

    loadSong(currentSong, false);
  }
}

/* =========================================================
   LOAD CURRENT SONG
========================================================= */

function loadSong(index, shouldAutoPlay = false) {
  if (
    !Array.isArray(songs) ||
    !songs[index]
  ) {
    return;
  }

  const song = songs[index];

  /*
   * Update state
   */

  currentSong = index;

  /*
   * Audio
   */

  if (audio) {
    audio.pause();

    audio.currentTime = 0;

    const audioUrl =
      buildUrl(song.audio_url);

    if (audioUrl) {
      audio.src = audioUrl;
    } else {
      audio.removeAttribute("src");
    }

    audio.load();
  }

  /*
   * Cover
   */

  if (cover) {
    const coverUrl =
      buildUrl(song.cover_url);

    cover.src =
      coverUrl || DEFAULT_COVER;
  }

  /*
   * Title
   */

  if (title) {
    title.textContent =
      song.title || "Unknown Song";
  }

  /*
   * Artist
   */

  if (artist) {
    artist.textContent =
      song.artist || "Unknown Artist";
  }

  /*
   * Reset progress
   */

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

  /*
   * Browser title
   */

  document.title =
    `${song.title || "Music Player"} | Music Player`;

  /*
   * Save state
   */

  saveCurrentSong();

  /*
   * New song starts from zero
   */

  localStorage.setItem(
    "currentPlaybackTime",
    "0"
  );

  /*
   * Update cards
   */

  updatePlayingUI();

  /*
   * Reset button
   */

  isPlaying = false;

  updatePlayButton();

  /*
   * Auto play
   */

  if (shouldAutoPlay) {
    playSong();
  }
}

/* =========================================================
   PLAY SONG
========================================================= */

async function playSong() {
  if (!songs.length || !audio) {
    return;
  }

  try {
    await audio.play();

    isPlaying = true;

    saveCurrentSong();

    savePlaybackPosition();

    updatePlayButton();

    updatePlayingUI();
  } catch (error) {
    console.error(
      "Playback error:",
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

  savePlaybackPosition();

  audio.pause();

  isPlaying = false;

  updatePlayButton();

  updatePlayingUI();
}

/* =========================================================
   TOGGLE
========================================================= */

function togglePlay() {
  if (!songs.length) {
    return;
  }

  if (!audio.src) {
    loadSong(currentSong, true);

    return;
  }

  if (isPlaying) {
    pauseSong();
  } else {
    playSong();
  }
}

/* =========================================================
   PLAY BUTTON UI
========================================================= */

function updatePlayButton() {
  if (!playIcon) {
    return;
  }

  playIcon.className =
    isPlaying
      ? "fa-solid fa-pause"
      : "fa-solid fa-play";
}

/* =========================================================
   NEXT
========================================================= */

function nextSong(autoPlay = true) {
  if (!songs.length) {
    return;
  }

  /*
   * Save current position
   */

  savePlaybackPosition();

  currentSong++;

  if (currentSong >= songs.length) {
    currentSong = 0;
  }

  loadSong(
    currentSong,
    autoPlay
  );
}

/* =========================================================
   PREVIOUS
========================================================= */

function prevSong() {
  if (!songs.length) {
    return;
  }

  /*
   * If song played more than 3 seconds,
   * restart current song.
   */

  if (
    audio &&
    audio.currentTime > 3
  ) {
    audio.currentTime = 0;

    savePlaybackPosition();

    return;
  }

  savePlaybackPosition();

  currentSong--;

  if (currentSong < 0) {
    currentSong =
      songs.length - 1;
  }

  loadSong(
    currentSong,
    true
  );
}

/* =========================================================
   FORMAT TIME
========================================================= */

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

/* =========================================================
   AUDIO TIME UPDATE
========================================================= */

if (audio) {
  audio.addEventListener(
    "timeupdate",
    () => {
      if (
        !isNaN(audio.duration) &&
        audio.duration > 0
      ) {
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
      }

      /*
       * IMPORTANT:
       * Save current playback position
       * continuously.
       */

      savePlaybackPosition();
    }
  );
}

/* =========================================================
   METADATA
========================================================= */

if (audio) {
  audio.addEventListener(
    "loadedmetadata",
    () => {
      if (
        duration &&
        !isNaN(audio.duration)
      ) {
        duration.textContent =
          formatTime(
            audio.duration
          );
      }
    }
  );
}

/* =========================================================
   PROGRESS
========================================================= */

if (progress) {
  progress.addEventListener(
    "input",
    () => {
      if (!audio) {
        return;
      }

      audio.currentTime =
        Number(progress.value);

      savePlaybackPosition();
    }
  );
}

/* =========================================================
   AUDIO PLAY EVENT
========================================================= */

if (audio) {
  audio.addEventListener(
    "play",
    () => {
      isPlaying = true;

      updatePlayButton();

      updatePlayingUI();

      saveCurrentSong();

      savePlaybackPosition();
    }
  );
}

/* =========================================================
   AUDIO PAUSE EVENT
========================================================= */

if (audio) {
  audio.addEventListener(
    "pause",
    () => {
      savePlaybackPosition();

      isPlaying = false;

      updatePlayButton();

      updatePlayingUI();
    }
  );
}

/* =========================================================
   AUDIO ENDED
========================================================= */

if (audio) {
  audio.addEventListener(
    "ended",
    () => {
      /*
       * Reset saved playback position
       */

      localStorage.setItem(
        "currentPlaybackTime",
        "0"
      );

      isPlaying = false;

      updatePlayButton();

      nextSong(true);
    }
  );
}

/* =========================================================
   CREATE SONG CARDS
========================================================= */

function renderSongs(
  songList = songs
) {
  if (!songGrid) {
    return;
  }

  songGrid.innerHTML = "";

  if (
    !Array.isArray(songList) ||
    songList.length === 0
  ) {
    if (noResults) {
      noResults.hidden = false;
    }

    return;
  }

  if (noResults) {
    noResults.hidden = true;
  }

  songList.forEach((song) => {
    const index =
      songs.findIndex(
        (item) =>
          String(item.id) ===
          String(song.id)
      );

    const card =
      document.createElement(
        "article"
      );

    card.className =
      "song-card";

    if (
      index === currentSong
    ) {
      card.classList.add(
        "playing"
      );
    }

    /*
     * Image wrapper
     */

    const imageWrap =
      document.createElement(
        "div"
      );

    imageWrap.className =
      "song-image-wrap";

    const image =
      document.createElement(
        "img"
      );

    image.src =
      buildUrl(
        song.cover_url
      ) || DEFAULT_COVER;

    image.alt =
      song.title || "Song";

    image.loading =
      "lazy";

    image.onerror = () => {
      image.src =
        DEFAULT_COVER;
    };

    const playOverlay =
      document.createElement(
        "div"
      );

    playOverlay.className =
      "play-overlay";

    const overlayIcon =
      document.createElement(
        "i"
      );

    overlayIcon.className =
      index === currentSong &&
      isPlaying
        ? "fa-solid fa-pause"
        : "fa-solid fa-play";

    playOverlay.appendChild(
      overlayIcon
    );

    imageWrap.appendChild(
      image
    );

    imageWrap.appendChild(
      playOverlay
    );

    /*
     * Title
     */

    const cardTitle =
      document.createElement(
        "h3"
      );

    cardTitle.textContent =
      song.title ||
      "Unknown Song";

    /*
     * Artist
     */

    const cardArtist =
      document.createElement(
        "p"
      );

    cardArtist.textContent =
      song.artist ||
      "Unknown Artist";

    /*
     * Build card
     */

    card.appendChild(
      imageWrap
    );

    card.appendChild(
      cardTitle
    );

    card.appendChild(
      cardArtist
    );

    /*
     * =====================================================
     * CHANGE 1:
     * CARD CLICK -> OPEN FULL PLAYER + AUTOPLAY
     * =====================================================
     */

    card.addEventListener(
      "click",
      () => {
        openSongInPlayer(index);
      }
    );

    songGrid.appendChild(
      card
    );
  });
}

/* =========================================================
   PLAY SONG FROM LIST
   Used by playlist / hero / other controls
========================================================= */

function playSongFromList(
  index
) {
  if (
    index < 0 ||
    !songs[index]
  ) {
    return;
  }

  /*
   * Same song
   */

  if (
    currentSong === index &&
    audio &&
    audio.src
  ) {
    if (isPlaying) {
      pauseSong();
    } else {
      playSong();
    }

    return;
  }

  /*
   * New song
   */

  loadSong(
    index,
    true
  );
}

/* =========================================================
   OPEN SONG IN FULL PLAYER
========================================================= */

function openSongInPlayer(
  index
) {
  if (
    index < 0 ||
    !songs[index]
  ) {
    return;
  }

  const song =
    songs[index];

  /*
   * Check whether this is
   * currently selected song
   */

  const wasCurrentSong =
    currentSong === index;

  /*
   * IMPORTANT:
   * Save current playback position
   * before changing currentSong.
   */

  if (
    wasCurrentSong &&
    audio
  ) {
    savePlaybackPosition();
  }

  /*
   * Set selected song
   */

  currentSong = index;

  /*
   * Save selected song
   */

  saveCurrentSong();

  /*
   * If different song selected,
   * player page starts from 0.
   */

  if (!wasCurrentSong) {
    localStorage.setItem(
      "currentPlaybackTime",
      "0"
    );
  }

  /*
   * Tell player page to autoplay
   */

  localStorage.setItem(
    "playerAutoPlay",
    "true"
  );

  /*
   * Open player page
   */

  if (
    song.id !== undefined
  ) {
    window.location.href =
      `player.html?id=${encodeURIComponent(
        song.id
      )}`;
  } else {
    window.location.href =
      "player.html";
  }
}

/* =========================================================
   PLAYLIST
========================================================= */

function createPlaylist() {
  if (!playlist) {
    return;
  }

  playlist.innerHTML = "";

  if (!songs.length) {
    return;
  }

  songs.forEach(
    (song, index) => {
      const li =
        document.createElement(
          "li"
        );

      if (
        index === currentSong
      ) {
        li.classList.add(
          "playing"
        );
      }

      /*
       * Number
       */

      const number =
        document.createElement(
          "div"
        );

      number.className =
        "playlist-number";

      number.textContent =
        String(index + 1)
          .padStart(2, "0");

      /*
       * Cover
       */

      const image =
        document.createElement(
          "img"
        );

      image.className =
        "playlist-cover";

      image.src =
        buildUrl(
          song.cover_url
        ) || DEFAULT_COVER;

      image.alt =
        song.title || "Song";

      image.onerror = () => {
        image.src =
          DEFAULT_COVER;
      };

      /*
       * Info
       */

      const info =
        document.createElement(
          "div"
        );

      info.className =
        "playlist-info";

      const songTitle =
        document.createElement(
          "strong"
        );

      songTitle.textContent =
        song.title ||
        "Unknown Song";

      const songArtist =
        document.createElement(
          "span"
        );

      songArtist.textContent =
        song.artist ||
        "Unknown Artist";

      info.appendChild(
        songTitle
      );

      info.appendChild(
        songArtist
      );

      /*
       * Status
       */

      const status =
        document.createElement(
          "div"
        );

      status.className =
        "playlist-status";

      const icon =
        document.createElement(
          "i"
        );

      icon.className =
        index === currentSong &&
        isPlaying
          ? "fa-solid fa-volume-high"
          : "fa-solid fa-music";

      status.appendChild(
        icon
      );

      /*
       * Build
       */

      li.appendChild(
        number
      );

      li.appendChild(
        image
      );

      li.appendChild(
        info
      );

      li.appendChild(
        status
      );

      /*
       * Playlist click
       * Existing behavior kept
       */

      li.addEventListener(
        "click",
        () => {
          playSongFromList(
            index
          );
        }
      );

      playlist.appendChild(
        li
      );
    }
  );
}

/* =========================================================
   UPDATE PLAYING UI
========================================================= */

function updatePlayingUI() {
  /*
   * Re-render cards
   */

  if (songGrid) {
    const searchText =
      searchInput
        ? searchInput.value
            .toLowerCase()
            .trim()
        : "";

    if (!searchText) {
      renderSongs(
        songs
      );
    } else {
      filterSongs(
        searchText
      );
    }
  }

  /*
   * Re-render playlist
   */

  createPlaylist();
}

/* =========================================================
   SEARCH FILTER
========================================================= */

function filterSongs(
  searchText
) {
  if (
    !Array.isArray(
      songs
    )
  ) {
    return;
  }

  const filtered =
    songs.filter(
      (song) => {
        const songTitle =
          String(
            song.title || ""
          ).toLowerCase();

        const songArtist =
          String(
            song.artist || ""
          ).toLowerCase();

        const album =
          String(
            song.album || ""
          ).toLowerCase();

        return (
          songTitle.includes(
            searchText
          ) ||
          songArtist.includes(
            searchText
          ) ||
          album.includes(
            searchText
          )
        );
      }
    );

  renderSongs(
    filtered
  );
}

/* =========================================================
   SEARCH
========================================================= */

if (searchInput) {
  searchInput.addEventListener(
    "input",
    () => {
      const text =
        searchInput.value
          .toLowerCase()
          .trim();

      /*
       * Clear button
       */

      if (clearSearch) {
        clearSearch.classList.toggle(
          "visible",
          text.length > 0
        );
      }

      if (!text) {
        renderSongs(
          songs
        );

        if (noResults) {
          noResults.hidden =
            true;
        }

        return;
      }

      filterSongs(
        text
      );
    }
  );
}

/* =========================================================
   CLEAR SEARCH
========================================================= */

if (clearSearch) {
  clearSearch.addEventListener(
    "click",
    () => {
      if (!searchInput) {
        return;
      }

      searchInput.value = "";

      clearSearch.classList.remove(
        "visible"
      );

      renderSongs(
        songs
      );

      searchInput.focus();
    }
  );
}

/* =========================================================
   HERO PLAY
========================================================= */

if (heroPlay) {
  heroPlay.addEventListener(
    "click",
    () => {
      if (!songs.length) {
        return;
      }

      /*
       * If something is playing,
       * pause it.
       */

      if (isPlaying) {
        pauseSong();

        return;
      }

      /*
       * Play current song
       */

      playSongFromList(
        currentSong
      );
    }
  );
}

/* =========================================================
   MAIN PLAY BUTTON
========================================================= */

if (playBtn) {
  playBtn.addEventListener(
    "click",
    togglePlay
  );
}

/* =========================================================
   NEXT BUTTON
========================================================= */

if (nextBtn) {
  nextBtn.addEventListener(
    "click",
    () => {
      nextSong(true);
    }
  );
}

/* =========================================================
   PREVIOUS BUTTON
========================================================= */

if (prevBtn) {
  prevBtn.addEventListener(
    "click",
    prevSong
  );
}

/* =========================================================
   CHANGE 2:
   MINI PLAYER -> FULL PLAYER
========================================================= */

if (openPlayer) {
  openPlayer.addEventListener(
    "click",
    () => {
      if (!songs.length) {
        return;
      }

      /*
       * Save current playback position
       */

      savePlaybackPosition();

      /*
       * Save current song
       */

      saveCurrentSong();

      /*
       * Tell player page to autoplay
       */

      localStorage.setItem(
        "playerAutoPlay",
        "true"
      );

      /*
       * Get currently selected song
       */

      const song =
        songs[currentSong];

      /*
       * Open full player
       */

      if (
        song &&
        song.id !== undefined
      ) {
        window.location.href =
          `player.html?id=${encodeURIComponent(
            song.id
          )}`;
      } else {
        window.location.href =
          "player.html";
      }
    }
  );
}

/* =========================================================
   SAVE CURRENT SONG
========================================================= */

function saveCurrentSong() {
  if (
    !songs.length ||
    !songs[currentSong]
  ) {
    return;
  }

  try {
    localStorage.setItem(
      "selectedSong",
      JSON.stringify(
        songs[currentSong]
      )
    );

    localStorage.setItem(
      "allSongs",
      JSON.stringify(
        songs
      )
    );

    localStorage.setItem(
      "currentSongIndex",
      String(
        currentSong
      )
    );
  } catch (error) {
    console.warn(
      "Unable to save player state:",
      error
    );
  }
}

/* =========================================================
   SAVE BEFORE PAGE CLOSE / NAVIGATION
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {
    savePlaybackPosition();

    saveCurrentSong();
  }
);

/* =========================================================
   SERVICE WORKER
========================================================= */

if (
  "serviceWorker" in navigator
) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker
        .register(
          "./service-worker.js"
        )
        .then(
          (registration) => {
            console.log(
              "Service Worker enabled:",
              registration.scope
            );
          }
        )
        .catch(
          (error) => {
            console.warn(
              "Service Worker unavailable:",
              error.message
            );
          }
        );
    }
  );
}

/* =========================================================
   START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    loadSongs();
  }
);


/* =========================================================
   MINI PLAYER -> FULL PLAYER
========================================================= */

const playerSong = document.getElementById("playerSong");
const openPlayerBtn = document.getElementById("openPlayer");

/* =========================================================
   OPEN CURRENT SONG - PROFESSIONAL TRANSITION
========================================================= */

function openCurrentSongInPlayer() {

  if (
    !Array.isArray(songs) ||
    songs.length === 0 ||
    !songs[currentSong]
  ) {
    return;
  }

  const song = songs[currentSong];

  /*
   * Save current playback state
   */
  savePlaybackPosition();

  try {

    localStorage.setItem(
      "selectedSong",
      JSON.stringify(song)
    );

    localStorage.setItem(
      "currentSongIndex",
      String(currentSong)
    );

    localStorage.setItem(
      "allSongs",
      JSON.stringify(songs)
    );

    localStorage.setItem(
      "playerAutoPlay",
      isPlaying ? "true" : "false"
    );

  } catch (error) {

    console.warn(
      "Unable to save player state:",
      error
    );

  }


  /*
   * Add exit animation
   */
  document.body.classList.add(
    "player-opening"
  );


  const playerUrl =
    song.id !== undefined &&
    song.id !== null
      ? `player.html?id=${encodeURIComponent(song.id)}`
      : "player.html";


  /*
   * Use View Transition API
   * when browser supports it
   */

  if (
    document.startViewTransition
  ) {

    document.startViewTransition(
      () => {
        window.location.href =
          playerUrl;
      }
    );

  } else {

    /*
     * Fallback animation
     */

    setTimeout(() => {

      window.location.href =
        playerUrl;

    }, 260);

  }

}


/* =========================================================
   CLICK SONG INFO / COVER
========================================================= */

if (playerSong) {

  playerSong.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      openCurrentSongInPlayer();

    }
  );

}


/* =========================================================
   CLICK EXPAND BUTTON
========================================================= */

if (openPlayerBtn) {

  openPlayerBtn.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      openCurrentSongInPlayer();

    }
  );

}
