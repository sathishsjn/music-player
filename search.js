// =====================================
// SEARCH PAGE
// =====================================

const API_URL = "http://localhost:5000";

// =====================================
// ELEMENTS
// =====================================

const searchInput = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const resultCount = document.getElementById("resultCount");
const searchResults = document.getElementById("searchResults");
const searchLoading = document.getElementById("searchLoading");
const noResults = document.getElementById("noResults");

// =====================================
// STATE
// =====================================

let songs = [];
let loaded = false;

// =====================================
// DEFAULT COVER
// =====================================

const DEFAULT_COVER = "assets/images/cover8.jpg";

// =====================================
// LOAD SONGS
// =====================================

async function loadSongs() {
  try {
    const response = await fetch(`${API_URL}/api/songs`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    songs = data.songs || [];

    loaded = true;

    // If there's a preserved query, run it
    const query = searchInput.value.trim();

    if (query) {
      performSearch(query);
    } else {
      showInitialState();
    }
  } catch (error) {
    console.error("Error loading songs:", error);

    if (searchLoading) {
      searchLoading.innerHTML = `
        <i class="fa-solid fa-circle-exclamation"></i>
        <span>Unable to load songs. Please check your backend.</span>
      `;
    }
  }
}

// =====================================
// SHOW INITIAL STATE
// =====================================

function showInitialState() {
  if (searchLoading) searchLoading.style.display = "none";

  if (noResults) noResults.hidden = true;

  if (resultCount) resultCount.hidden = true;

  searchResults.innerHTML = "";

  // Show a hint when no search has been typed yet
  const hint = document.createElement("div");
  hint.className = "no-results";
  hint.innerHTML = `
    <i class="fa-solid fa-magnifying-glass"></i>
    <h3>Search your music</h3>
    <p>Type to search by title, artist, or album.</p>
  `;
  searchResults.appendChild(hint);
}

// =====================================
// NORMALIZE TEXT (whitespace-tolerant, case-insensitive)
// =====================================

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

// =====================================
// PERFORM SEARCH
// =====================================

function performSearch(rawQuery) {
  const query = normalizeText(rawQuery);

  if (searchLoading) searchLoading.style.display = "none";

  if (noResults) noResults.hidden = true;

  if (!query) {
    showInitialState();
    return;
  }

  const filtered = songs.filter((song) => {
    const title = normalizeText(song.title);
    const artist = normalizeText(song.artist);
    const album = normalizeText(song.album);
    const category = normalizeText(song.category || song.genre);

    return (
      title.includes(query) ||
      artist.includes(query) ||
      album.includes(query) ||
      category.includes(query)
    );
  });

  // Result count
  if (resultCount) {
    resultCount.hidden = false;
    resultCount.textContent = `${filtered.length} result${filtered.length === 1 ? "" : "s"} found`;
  }

  // No results
  if (filtered.length === 0) {
    searchResults.innerHTML = "";
    if (noResults) noResults.hidden = false;
    return;
  }

  renderResults(filtered);
}

// =====================================
// RENDER RESULTS
// =====================================

function renderResults(list) {
  searchResults.innerHTML = "";

  list.forEach((song, index) => {
    const card = document.createElement("div");
    card.className = "search-result-card";

    const coverUrl = song.cover_url ? API_URL + song.cover_url : DEFAULT_COVER;

    const subParts = [];
    if (song.artist) subParts.push(song.artist);
    if (song.album) subParts.push(song.album);
    if (song.category || song.genre) subParts.push(song.category || song.genre);

    card.innerHTML = `
      <img
        class="search-result-cover"
        src="${coverUrl}"
        alt="${song.title || "Song"}"
        loading="lazy"
      >
      <div class="search-result-info">
        <div class="search-result-title">${song.title || "Unknown Song"}</div>
        <div class="search-result-sub">${subParts.join(" • ") || "Unknown Artist"}</div>
      </div>
      <button type="button" class="search-result-play" aria-label="Play ${song.title || "song"}">
        <i class="fa-solid fa-play"></i>
      </button>
    `;

    const playBtn = card.querySelector(".search-result-play");

    if (playBtn) {
      playBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        playSong(song, index);
      });
    }

    card.addEventListener("click", () => {
      playSong(song, index);
    });

    searchResults.appendChild(card);
  });
}

// =====================================
// PLAY SONG (reuse existing player)
// =====================================

function playSong(song, index) {
  // Save selected song
  localStorage.setItem("selectedSong", JSON.stringify(song));

  // Save all songs
  localStorage.setItem("allSongs", JSON.stringify(songs));

  // Save selected index
  localStorage.setItem("currentSongIndex", String(index));

  // Open player page
  window.location.href =
    song?.id !== undefined
      ? `player.html?id=${encodeURIComponent(song.id)}`
      : "player.html";
}

// =====================================
// EVENTS
// =====================================

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const value = searchInput.value;

    // Show/hide clear button
    if (clearBtn) {
      clearBtn.hidden = value.length === 0;
    }

    if (!loaded) return;

    performSearch(value);
  });

  // Preserve search query from URL if present
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (q) {
    searchInput.value = q;
    if (clearBtn) clearBtn.hidden = false;
  }
}

if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    clearBtn.hidden = true;
    searchInput.focus();
    showInitialState();
  });
}

// =====================================
// START
// =====================================

loadSongs();
