/* =========================================================
   FAVORITES PAGE
========================================================= */

const API_URL = "https://music-player-0qp9.onrender.com";

const DEFAULT_COVER = "assets/images/cover8.jpg";

/* =========================================================
   ELEMENTS
========================================================= */

const favoritesList = document.getElementById("favoritesList");
const emptyState = document.getElementById("emptyState");
const favoriteCount = document.getElementById("favoriteCount");

const backBtn = document.getElementById("backBtn");
const browseSongs = document.getElementById("browseSongs");

const miniPlayer = document.getElementById("miniPlayer");
const miniCover = document.getElementById("miniCover");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");
const miniPlay = document.getElementById("miniPlay");
const miniPlayIcon = document.getElementById("miniPlayIcon");


/* =========================================================
   STATE
========================================================= */

let songs = [];
let favorites = [];


/* =========================================================
   BUILD URL
========================================================= */

function buildUrl(path) {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  if (
    path.startsWith("./") ||
    path.startsWith("assets/")
  ) {
    return path;
  }

  return API_URL + path;
}


/* =========================================================
   LOAD SONGS
========================================================= */

async function loadSongs() {
  try {
    const response = await fetch(
      `${API_URL}/api/songs`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-cache",
      },
    );

    if (!response.ok) {
      throw new Error(
        `Server error: ${response.status}`,
      );
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      songs = data;
    } else if (
      data &&
      Array.isArray(data.songs)
    ) {
      songs = data.songs;
    } else if (
      data &&
      Array.isArray(data.data)
    ) {
      songs = data.data;
    } else {
      songs = [];
    }

    /*
     * Save latest song library
     */

    localStorage.setItem(
      "allSongs",
      JSON.stringify(songs),
    );

    loadFavorites();

  } catch (error) {
    console.error(
      "Unable to load songs:",
      error,
    );

    /*
     * Fallback to locally saved songs
     */

    try {
      const savedSongs =
        localStorage.getItem("allSongs");

      if (savedSongs) {
        songs = JSON.parse(savedSongs);
      }
    } catch (error) {
      console.warn(
        "Unable to restore songs:",
        error,
      );
    }

    loadFavorites();
  }
}


/* =========================================================
   LOAD FAVORITES
========================================================= */

function loadFavorites() {
  try {
    const savedFavorites =
      localStorage.getItem("favoriteSongs");

    if (!savedFavorites) {
      favorites = [];
    } else {
      const parsed =
        JSON.parse(savedFavorites);

      favorites = Array.isArray(parsed)
        ? parsed
        : [];
    }

  } catch (error) {
    console.warn(
      "Unable to load favorites:",
      error,
    );

    favorites = [];
  }

  /*
   * Remove songs that no longer exist
   */

  favorites = favorites.filter(
    (favoriteId) =>
      songs.some(
        (song) =>
          String(song.id) ===
          String(favoriteId),
      ),
  );

  saveFavorites();

  renderFavorites();
}


/* =========================================================
   SAVE FAVORITES
========================================================= */

function saveFavorites() {
  try {
    localStorage.setItem(
      "favoriteSongs",
      JSON.stringify(favorites),
    );
  } catch (error) {
    console.warn(
      "Unable to save favorites:",
      error,
    );
  }
}


/* =========================================================
   CHECK FAVORITE
========================================================= */

function isFavorite(songId) {
  return favorites.some(
    (id) =>
      String(id) === String(songId),
  );
}


/* =========================================================
   ADD FAVORITE
========================================================= */

function addFavorite(songId) {
  if (isFavorite(songId)) {
    return;
  }

  favorites.push(songId);

  saveFavorites();

  renderFavorites();
}


/* =========================================================
   REMOVE FAVORITE
========================================================= */

function removeFavorite(songId) {
  favorites = favorites.filter(
    (id) =>
      String(id) !== String(songId),
  );

  saveFavorites();

  renderFavorites();
}


/* =========================================================
   GET FAVORITE SONGS
========================================================= */

function getFavoriteSongs() {
  return favorites
    .map((favoriteId) =>
      songs.find(
        (song) =>
          String(song.id) ===
          String(favoriteId),
      ),
    )
    .filter(Boolean);
}


/* =========================================================
   RENDER FAVORITES
========================================================= */

function renderFavorites() {
  if (!favoritesList) {
    return;
  }

  const favoriteSongs =
    getFavoriteSongs();

  /*
   * Count
   */

  if (favoriteCount) {
    favoriteCount.textContent =
      `${favoriteSongs.length} ${
        favoriteSongs.length === 1
          ? "song"
          : "songs"
      }`;
  }

  /*
   * Empty state
   */

  if (favoriteSongs.length === 0) {
    favoritesList.innerHTML = "";

    favoritesList.classList.add(
      "hidden",
    );

    if (emptyState) {
      emptyState.classList.remove(
        "hidden",
      );
    }

    return;
  }

  /*
   * Show list
   */

  favoritesList.classList.remove(
    "hidden",
  );

  if (emptyState) {
    emptyState.classList.add(
      "hidden",
    );
  }

  favoritesList.innerHTML = "";

  favoriteSongs.forEach(
    (song, index) => {
      createFavoriteCard(
        song,
        index,
      );
    },
  );
}


/* =========================================================
   CREATE FAVORITE CARD
========================================================= */

function createFavoriteCard(
  song,
  index,
) {
  const card =
    document.createElement("article");

  card.className =
    "favorite-card";

  /*
   * Cover
   */

  const cover =
    document.createElement("img");

  cover.className =
    "favorite-cover";

  cover.src =
    buildUrl(song.cover_url) ||
    DEFAULT_COVER;

  cover.alt =
    song.title || "Song";

  cover.loading = "lazy";

  cover.onerror = () => {
    cover.src = DEFAULT_COVER;
  };


  /*
   * Info
   */

  const info =
    document.createElement("div");

  info.className =
    "favorite-info";


  const title =
    document.createElement("h3");

  title.className =
    "favorite-title";

  title.textContent =
    song.title ||
    "Unknown Song";


  const artist =
    document.createElement("span");

  artist.className =
    "favorite-artist";

  artist.textContent =
    song.artist ||
    "Unknown Artist";


  info.appendChild(title);
  info.appendChild(artist);


  /*
   * Favorite button
   */

  const favoriteBtn =
    document.createElement("button");

  favoriteBtn.className =
    "favorite-btn";

  favoriteBtn.type = "button";

  favoriteBtn.setAttribute(
    "aria-label",
    "Remove from favorites",
  );

  favoriteBtn.innerHTML =
    `<i class="fa-solid fa-heart"></i>`;


  /*
   * Prevent card click
   */

  favoriteBtn.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      removeFavorite(song.id);
    },
  );


  /*
   * Card click
   */

  card.addEventListener(
    "click",
    () => {
      openSongInPlayer(song);
    },
  );


  /*
   * Build card
   */

  card.appendChild(cover);

  card.appendChild(info);

  card.appendChild(favoriteBtn);

  favoritesList.appendChild(card);
}


/* =========================================================
   OPEN SONG IN PLAYER
========================================================= */

function openSongInPlayer(song) {
  if (!song) {
    return;
  }

  /*
   * Save selected song
   */

  try {
    localStorage.setItem(
      "selectedSong",
      JSON.stringify(song),
    );

    /*
     * Find index in complete library
     */

    const index =
      songs.findIndex(
        (item) =>
          String(item.id) ===
          String(song.id),
      );

    if (index >= 0) {
      localStorage.setItem(
        "currentSongIndex",
        String(index),
      );
    }

    /*
     * Keep complete library
     */

    localStorage.setItem(
      "allSongs",
      JSON.stringify(songs),
    );

    /*
     * Tell player page to autoplay
     */

    localStorage.setItem(
      "playerAutoPlay",
      "true",
    );

    /*
     * New song should start
     * from beginning
     */

    localStorage.setItem(
      "currentPlaybackTime",
      "0",
    );

  } catch (error) {
    console.warn(
      "Unable to save player state:",
      error,
    );
  }

  /*
   * Open player
   */

  if (song.id !== undefined) {
    window.location.href =
      `player.html?id=${encodeURIComponent(
        song.id,
      )}`;
  } else {
    window.location.href =
      "player.html";
  }
}


/* =========================================================
   CURRENT SONG
========================================================= */

function getCurrentSong() {
  try {
    const savedSong =
      localStorage.getItem(
        "selectedSong",
      );

    if (savedSong) {
      return JSON.parse(savedSong);
    }
  } catch (error) {
    console.warn(
      "Unable to get current song:",
      error,
    );
  }

  return null;
}


/* =========================================================
   MINI PLAYER
========================================================= */

function updateMiniPlayer() {
  const song =
    getCurrentSong();

  if (!song) {
    if (miniPlayer) {
      miniPlayer.classList.add(
        "hidden",
      );
    }

    return;
  }

  if (!miniPlayer) {
    return;
  }

  miniPlayer.classList.remove(
    "hidden",
  );

  /*
   * Cover
   */

  if (miniCover) {
    miniCover.src =
      buildUrl(song.cover_url) ||
      DEFAULT_COVER;

    miniCover.onerror = () => {
      miniCover.src =
        DEFAULT_COVER;
    };
  }

  /*
   * Title
   */

  if (miniTitle) {
    miniTitle.textContent =
      song.title ||
      "Unknown Song";
  }

  /*
   * Artist
   */

  if (miniArtist) {
    miniArtist.textContent =
      song.artist ||
      "Unknown Artist";
  }

  /*
   * Playback state
   */

  const playing =
    localStorage.getItem(
      "isPlaying",
    ) === "true";

  updateMiniPlayButton(
    playing,
  );
}


/* =========================================================
   MINI PLAY BUTTON
========================================================= */

function updateMiniPlayButton(
  playing,
) {
  if (!miniPlayIcon) {
    return;
  }

  miniPlayIcon.className =
    playing
      ? "fa-solid fa-pause"
      : "fa-solid fa-play";
}


/* =========================================================
   MINI PLAYER CLICK
========================================================= */

if (miniPlayer) {
  miniPlayer.addEventListener(
    "click",
    (event) => {
      /*
       * Don't open player when
       * clicking play button
       */

      if (
        miniPlay &&
        miniPlay.contains(event.target)
      ) {
        return;
      }

      const song =
        getCurrentSong();

      if (!song) {
        return;
      }

      /*
       * Current song open
       */

      try {
        localStorage.setItem(
          "playerAutoPlay",
          "true",
        );
      } catch (error) {
        console.warn(error);
      }

      if (song.id !== undefined) {
        window.location.href =
          `player.html?id=${encodeURIComponent(
            song.id,
          )}`;
      } else {
        window.location.href =
          "player.html";
      }
    },
  );
}


/* =========================================================
   MINI PLAY
========================================================= */

if (miniPlay) {
  miniPlay.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      /*
       * We cannot directly control
       * audio element from another page.
       *
       * Instead send command to
       * player page.
       */

      const song =
        getCurrentSong();

      if (!song) {
        return;
      }

      const playing =
        localStorage.getItem(
          "isPlaying",
        ) === "true";

      try {
        localStorage.setItem(
          "playerAutoPlay",
          playing
            ? "false"
            : "true",
        );
      } catch (error) {
        console.warn(error);
      }

      if (song.id !== undefined) {
        window.location.href =
          `player.html?id=${encodeURIComponent(
            song.id,
          )}`;
      } else {
        window.location.href =
          "player.html";
      }
    },
  );
}


/* =========================================================
   BACK BUTTON
========================================================= */

if (backBtn) {
  backBtn.addEventListener(
    "click",
    () => {
      /*
       * Go back if possible
       */

      if (
        document.referrer &&
        document.referrer !==
          window.location.href
      ) {
        window.history.back();
      } else {
        window.location.href =
          "index.html";
      }
    },
  );
}


/* =========================================================
   BROWSE SONGS
========================================================= */

if (browseSongs) {
  browseSongs.addEventListener(
    "click",
    () => {
      window.location.href =
        "index.html";
    },
  );
}


/* =========================================================
   STORAGE SYNC
========================================================= */

window.addEventListener(
  "storage",
  (event) => {
    if (
      event.key ===
      "favoriteSongs"
    ) {
      loadFavorites();
    }

    if (
      event.key ===
      "selectedSong"
    ) {
      updateMiniPlayer();
    }

    if (
      event.key ===
      "isPlaying"
    ) {
      updateMiniPlayer();
    }
  },
);


/* =========================================================
   PAGE VISIBILITY
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {
    if (
      !document.hidden
    ) {
      loadFavorites();
      updateMiniPlayer();
    }
  },
);


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {
    updateMiniPlayer();

    loadSongs();
  },
);


