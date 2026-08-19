/* =========================================================
   MUSIC PLAYER ADMIN
========================================================= */

const API_URL =
  "https://music-player-0qp9.onrender.com";


/* =========================================================
   ELEMENTS
========================================================= */

const totalSongsEl =
  document.getElementById("total-songs");

const recentListEl =
  document.getElementById("recent-list");

const libraryCountEl =
  document.getElementById("library-count");

const btnAddSong =
  document.getElementById("btn-add-song");

const btnRefresh =
  document.getElementById("btn-refresh");

const btnHeaderRefresh =
  document.getElementById("btn-header-refresh");

const btnManageSongs =
  document.getElementById("btn-manage-songs");

const searchInput =
  document.getElementById("search");

const clearSearch =
  document.getElementById("clear-search");

const songsContainer =
  document.getElementById("songs-container");

const emptyState =
  document.getElementById("empty-state");

const emptyAddSong =
  document.getElementById("empty-add-song");

const modalRoot =
  document.getElementById("modal-root");

const toastsRoot =
  document.getElementById("toasts");

const previewAudio =
  document.getElementById("preview-audio");


/* =========================================================
   STATE
========================================================= */

let songs = [];

let filteredSongs = [];

let currentSort = "newest";

let previewSongId = null;


/* =========================================================
   URL BUILDER
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
   SAFE JSON
========================================================= */

async function readJson(response) {

  try {
    return await response.json();

  } catch {

    return {};
  }
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  message,
  type = "success",
  time = 3000
) {

  if (!toastsRoot) {
    return;
  }

  const toast =
    document.createElement("div");

  toast.className =
    `toast ${type}`;

  toast.textContent = message;

  toastsRoot.appendChild(toast);

  setTimeout(() => {

    toast.remove();

  }, time);
}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

  if (!songsContainer) {
    return;
  }

  songsContainer.innerHTML = `
    <div class="loading">
      <i class="fa-solid fa-spinner fa-spin"></i>
      Loading songs...
    </div>
  `;

  emptyState.classList.add("hidden");
}


/* =========================================================
   NORMALIZE SONG RESPONSE
========================================================= */

function normalizeSongs(data) {

  if (Array.isArray(data)) {
    return data;
  }

  if (
    data &&
    Array.isArray(data.songs)
  ) {
    return data.songs;
  }

  if (
    data &&
    data.data &&
    Array.isArray(data.data)
  ) {
    return data.data;
  }

  if (
    data &&
    data.data &&
    Array.isArray(data.data.songs)
  ) {
    return data.data.songs;
  }

  return [];
}


/* =========================================================
   LOAD SUMMARY
========================================================= */

async function loadSummary() {

  try {

    const response =
      await fetch(
        `${API_URL}/api/admin/summary`,
        {
          cache: "no-cache",
        }
      );

    if (!response.ok) {
      throw new Error(
        `Summary error ${response.status}`
      );
    }

    const data =
      await readJson(response);

    totalSongsEl.textContent =
      data.total ?? songs.length;

    const recent =
      Array.isArray(data.recent)
        ? data.recent
        : [];

    recentListEl.textContent =
      recent
        .slice(0, 3)
        .map(
          (song) =>
            song.title || "Untitled"
        )
        .join(", ") || "—";

  } catch (error) {

    console.error(
      "Summary error:",
      error
    );

    totalSongsEl.textContent =
      songs.length || "—";

    recentListEl.textContent = "—";
  }
}


/* =========================================================
   LOAD SONGS
========================================================= */

async function loadSongs(
  showMessage = false
) {

  try {

    showLoading();

    const response =
      await fetch(
        `${API_URL}/api/admin/songs`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache: "no-cache",
        }
      );

    if (!response.ok) {

      throw new Error(
        `Songs error ${response.status}`
      );
    }

    const data =
      await readJson(response);

    songs =
      normalizeSongs(data);

    filteredSongs =
      [...songs];

    updateLibraryCount();

    applyFilters();

    if (showMessage) {
      showToast(
        "Songs refreshed",
        "success"
      );
    }

  } catch (error) {

    console.error(
      "Load songs error:",
      error
    );

    songs = [];

    filteredSongs = [];

    songsContainer.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-wifi"></i>

        <h3>Unable to load songs</h3>

        <p>
          Check your internet connection
          or backend server.
        </p>

        <button
          id="retry-load"
          class="btn primary"
          type="button"
        >
          Retry
        </button>
      </div>
    `;

    const retry =
      document.getElementById(
        "retry-load"
      );

    if (retry) {

      retry.addEventListener(
        "click",
        () => loadSongs(true)
      );
    }

  }
}


/* =========================================================
   UPDATE COUNT
========================================================= */

function updateLibraryCount() {

  if (!libraryCountEl) {
    return;
  }

  const total =
    filteredSongs.length;

  libraryCountEl.textContent =
    `${total} ${
      total === 1
        ? "song"
        : "songs"
    }`;
}


/* =========================================================
   SORT
========================================================= */

function sortSongs(list) {

  const result = [...list];

  switch (currentSort) {

    case "oldest":

      return result.sort(
        (a, b) =>
          Number(a.id || 0) -
          Number(b.id || 0)
      );


    case "az":

      return result.sort(
        (a, b) =>
          String(a.title || "")
            .localeCompare(
              String(b.title || "")
            )
      );


    case "za":

      return result.sort(
        (a, b) =>
          String(b.title || "")
            .localeCompare(
              String(a.title || "")
            )
      );


    case "newest":
    default:

      return result.sort(
        (a, b) =>
          Number(b.id || 0) -
          Number(a.id || 0)
      );
  }
}


/* =========================================================
   APPLY SEARCH + SORT
========================================================= */

function applyFilters() {

  const query =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";

  let result = [...songs];

  if (query) {

    result =
      result.filter(
        (song) => {

          const title =
            String(
              song.title || ""
            ).toLowerCase();

          const artist =
            String(
              song.artist || ""
            ).toLowerCase();

          const album =
            String(
              song.album || ""
            ).toLowerCase();

          return (
            title.includes(query) ||
            artist.includes(query) ||
            album.includes(query)
          );
        }
      );
  }

  filteredSongs =
    sortSongs(result);

  updateLibraryCount();

  renderSongs(filteredSongs);

  if (clearSearch) {

    clearSearch.classList.toggle(
      "hidden",
      !query
    );
  }
}


/* =========================================================
   RENDER SONGS
========================================================= */

function renderSongs(list) {

  if (!songsContainer) {
    return;
  }

  songsContainer.innerHTML = "";

  if (
    !Array.isArray(list) ||
    list.length === 0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

    return;
  }

  emptyState.classList.add(
    "hidden"
  );


  list.forEach((song) => {

    const card =
      document.createElement("article");

    card.className =
      "song-card";


    /* COVER */

    const cover =
      document.createElement("div");

    cover.className =
      "song-cover";

    const coverUrl =
      buildUrl(song.cover_url);

    if (coverUrl) {

      cover.style.backgroundImage =
        `url("${coverUrl}")`;
    }


    /* META */

    const meta =
      document.createElement("div");

    meta.className =
      "song-meta";


    const title =
      document.createElement("div");

    title.className =
      "song-title";

    title.textContent =
      song.title ||
      "Untitled";


    const sub =
      document.createElement("div");

    sub.className =
      "song-sub";

    sub.textContent =
      `${song.artist || "Unknown Artist"} • ${
        song.album || "No Album"
      }`;


    const duration =
      document.createElement("div");

    duration.className =
      "song-sub";

    if (song.duration) {

      duration.textContent =
        `Duration: ${formatDuration(
          song.duration
        )}`;

    } else {

      duration.textContent =
        "Duration unavailable";
    }


    const id =
      document.createElement("div");

    id.className =
      "song-id";

    id.textContent =
      `ID: ${song.id ?? "-"}`;


    meta.appendChild(title);

    meta.appendChild(sub);

    meta.appendChild(duration);

    meta.appendChild(id);


    /* ACTIONS */

    const actions =
      document.createElement("div");

    actions.className =
      "song-actions";


    /* Preview */

    const previewBtn =
      document.createElement("button");

    previewBtn.type =
      "button";

    previewBtn.className =
      "btn preview";

    previewBtn.innerHTML =
      `<i class="fa-solid fa-play"></i>`;

    previewBtn.setAttribute(
      "aria-label",
      "Preview song"
    );

    previewBtn.addEventListener(
      "click",
      () => previewSong(song)
    );


    /* Edit */

    const editBtn =
      document.createElement("button");

    editBtn.type =
      "button";

    editBtn.className =
      "btn";

    editBtn.innerHTML =
      `<i class="fa-solid fa-pen"></i>`;

    editBtn.setAttribute(
      "aria-label",
      "Edit song"
    );

    editBtn.addEventListener(
      "click",
      () => openEditModal(song)
    );


    /* Delete */

    const deleteBtn =
      document.createElement("button");

    deleteBtn.type =
      "button";

    deleteBtn.className =
      "btn danger";

    deleteBtn.innerHTML =
      `<i class="fa-solid fa-trash"></i>`;

    deleteBtn.setAttribute(
      "aria-label",
      "Delete song"
    );

    deleteBtn.addEventListener(
      "click",
      () => openDeleteModal(song)
    );


    actions.appendChild(
      previewBtn
    );

    actions.appendChild(
      editBtn
    );

    actions.appendChild(
      deleteBtn
    );


    card.appendChild(cover);

    card.appendChild(meta);

    card.appendChild(actions);

    songsContainer.appendChild(card);
  });
}


/* =========================================================
   FORMAT DURATION
========================================================= */

function formatDuration(value) {

  const seconds =
    Number(value);

  if (
    !Number.isFinite(seconds) ||
    seconds < 0
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(seconds / 60);

  const secs =
    Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");

  return `${minutes}:${secs}`;
}


/* =========================================================
   PREVIEW SONG
========================================================= */

function previewSong(song) {

  if (!previewAudio) {
    return;
  }

  const url =
    buildUrl(song.audio_url);

  if (!url) {

    showToast(
      "Audio file not available",
      "error"
    );

    return;
  }


  /* Same song */

  if (
    previewSongId === song.id &&
    !previewAudio.paused
  ) {

    previewAudio.pause();

    previewSongId = null;

    removePreviewBar();

    return;
  }


  /* Stop previous */

  previewAudio.pause();

  previewAudio.currentTime = 0;

  previewSongId =
    song.id;


  previewAudio.src =
    url;


  previewAudio.play()
    .then(() => {

      showPreviewBar(song);

    })
    .catch((error) => {

      console.error(
        "Preview error:",
        error
      );

      showToast(
        "Unable to play preview",
        "error"
      );

      previewSongId = null;

      removePreviewBar();
    });
}


/* =========================================================
   PREVIEW BAR
========================================================= */

function showPreviewBar(song) {

  removePreviewBar();


  const bar =
    document.createElement("div");

  bar.id =
    "preview-bar";

  bar.className =
    "preview-bar";


  const cover =
    document.createElement("div");

  cover.className =
    "preview-cover";

  const coverUrl =
    buildUrl(song.cover_url);

  if (coverUrl) {

    cover.style.backgroundImage =
      `url("${coverUrl}")`;
  }


  const info =
    document.createElement("div");

  info.className =
    "preview-info";


  const title =
    document.createElement("div");

  title.className =
    "preview-title";

  title.textContent =
    song.title || "Untitled";


  const artist =
    document.createElement("div");

  artist.className =
    "preview-artist";

  artist.textContent =
    song.artist ||
    "Unknown Artist";


  info.appendChild(title);

  info.appendChild(artist);


  const control =
    document.createElement("button");

  control.type =
    "button";

  control.className =
    "preview-control";

  control.innerHTML =
    `<i class="fa-solid fa-pause"></i>`;


  control.addEventListener(
    "click",
    () => {

      if (
        previewAudio.paused
      ) {

        previewAudio.play();

        control.innerHTML =
          `<i class="fa-solid fa-pause"></i>`;

      } else {

        previewAudio.pause();

        control.innerHTML =
          `<i class="fa-solid fa-play"></i>`;
      }

    }
  );


  const close =
    document.createElement("button");

  close.type =
    "button";

  close.className =
    "preview-close";

  close.innerHTML =
    `<i class="fa-solid fa-xmark"></i>`;


  close.addEventListener(
    "click",
    () => {

      previewAudio.pause();

      previewAudio.currentTime =
        0;

      previewSongId = null;

      removePreviewBar();
    }
  );


  bar.appendChild(cover);

  bar.appendChild(info);

  bar.appendChild(control);

  bar.appendChild(close);


  document.body.appendChild(bar);
}


/* =========================================================
   REMOVE PREVIEW BAR
========================================================= */

function removePreviewBar() {

  const bar =
    document.getElementById(
      "preview-bar"
    );

  if (bar) {
    bar.remove();
  }
}


/* =========================================================
   AUDIO ENDED
========================================================= */

if (previewAudio) {

  previewAudio.addEventListener(
    "ended",
    () => {

      previewSongId = null;

      removePreviewBar();
    }
  );
}


/* =========================================================
   SEARCH
========================================================= */

if (searchInput) {

  searchInput.addEventListener(
    "input",
    applyFilters
  );
}


/* =========================================================
   CLEAR SEARCH
========================================================= */

if (clearSearch) {

  clearSearch.addEventListener(
    "click",
    () => {

      searchInput.value = "";

      applyFilters();

      searchInput.focus();
    }
  );
}


/* =========================================================
   SORT BUTTONS
========================================================= */

document
  .querySelectorAll(".filter-btn")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".filter-btn"
          )
          .forEach(
            (btn) =>
              btn.classList.remove(
                "active"
              )
          );

        button.classList.add(
          "active"
        );

        currentSort =
          button.dataset.sort ||
          "newest";

        applyFilters();
      }
    );
  });


/* =========================================================
   REFRESH
========================================================= */

async function refreshAll() {

  btnRefresh.disabled = true;

  if (btnHeaderRefresh) {
    btnHeaderRefresh.disabled =
      true;
  }

  try {

    await Promise.all([
      loadSongs(),
      loadSummary(),
    ]);

    showToast(
      "Admin panel refreshed"
    );

  } finally {

    btnRefresh.disabled = false;

    if (btnHeaderRefresh) {
      btnHeaderRefresh.disabled =
        false;
    }
  }
}


/* =========================================================
   REFRESH BUTTONS
========================================================= */

if (btnRefresh) {

  btnRefresh.addEventListener(
    "click",
    refreshAll
  );
}

if (btnHeaderRefresh) {

  btnHeaderRefresh.addEventListener(
    "click",
    refreshAll
  );
}


/* =========================================================
   MANAGE SONGS
========================================================= */

if (btnManageSongs) {

  btnManageSongs.addEventListener(
    "click",
    () => {

      document
        .querySelector(".manage")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }
  );
}


/* =========================================================
   EMPTY ADD
========================================================= */

if (emptyAddSong) {

  emptyAddSong.addEventListener(
    "click",
    openAddModal
  );
}


/* =========================================================
   ADD SONG
========================================================= */

if (btnAddSong) {

  btnAddSong.addEventListener(
    "click",
    openAddModal
  );
}


/* =========================================================
   MODAL CLOSE
========================================================= */

function closeModal() {

  modalRoot.innerHTML = "";
}


/* =========================================================
   MODAL BASE
========================================================= */

function createModal(
  title,
  content
) {

  modalRoot.innerHTML = `

    <div
      class="modal-backdrop"
      id="modal-backdrop"
      role="dialog"
      aria-modal="true"
    >

      <div class="modal">

        <div class="modal-handle"></div>

        <div class="modal-header">

          <h3>${title}</h3>

          <button
            type="button"
            class="modal-close"
            id="modal-close"
            aria-label="Close"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>

        </div>

        ${content}

      </div>

    </div>
  `;


  document
    .getElementById(
      "modal-close"
    )
    ?.addEventListener(
      "click",
      closeModal
    );


  document
    .getElementById(
      "modal-backdrop"
    )
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target.id ===
          "modal-backdrop"
        ) {

          closeModal();
        }
      }
    );
}


/* =========================================================
   ADD MODAL
========================================================= */

function openAddModal() {

  createModal(
    "Add Song",
    `
      <form
        id="add-form"
        class="form"
      >

        <label>
          Title

          <input
            name="title"
            type="text"
            required
            autocomplete="off"
            placeholder="Song title"
          />
        </label>


        <label>
          Artist

          <input
            name="artist"
            type="text"
            autocomplete="off"
            placeholder="Artist name"
          />
        </label>


        <label>
          Album

          <input
            name="album"
            type="text"
            autocomplete="off"
            placeholder="Album name"
          />
        </label>


        <label>
          Audio File

          <input
            name="song"
            type="file"
            accept="audio/*"
            required
          />
        </label>


        <label>
          Cover Image

          <input
            name="cover"
            type="file"
            accept="image/*"
          />
        </label>


        <div
          id="add-error"
          class="error hidden"
        ></div>


        <div class="form-actions">

          <button
            type="submit"
            class="btn primary"
          >
            <i class="fa-solid fa-cloud-arrow-up"></i>
            Upload
          </button>

          <button
            type="button"
            id="cancel-add"
            class="btn"
          >
            Cancel
          </button>

        </div>

      </form>
    `
  );


  document
    .getElementById(
      "cancel-add"
    )
    ?.addEventListener(
      "click",
      closeModal
    );


  const form =
    document.getElementById(
      "add-form"
    );


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const title =
        form.title.value.trim();

      const artist =
        form.artist.value.trim();

      const album =
        form.album.value.trim();

      const songFile =
        form.song.files[0];

      const coverFile =
        form.cover.files[0];


      const errorEl =
        document.getElementById(
          "add-error"
        );


      if (!songFile) {

        errorEl.textContent =
          "Audio file is required.";

        errorEl.classList.remove(
          "hidden"
        );

        return;
      }


      const formData =
        new FormData();


      formData.append(
        "title",
        title
      );

      formData.append(
        "artist",
        artist
      );

      formData.append(
        "album",
        album
      );

      formData.append(
        "song",
        songFile
      );


      if (coverFile) {

        formData.append(
          "cover",
          coverFile
        );
      }


      const submitBtn =
        form.querySelector(
          "button[type='submit']"
        );


      submitBtn.disabled = true;

      submitBtn.innerHTML =
        `<i class="fa-solid fa-spinner fa-spin"></i> Uploading...`;


      try {

        const response =
          await fetch(
            `${API_URL}/api/upload`,
            {
              method: "POST",
              body: formData,
            }
          );


        if (
          response.status !== 200 &&
          response.status !== 201
        ) {

          const data =
            await readJson(
              response
            );

          throw new Error(
            data.message ||
              "Upload failed"
          );
        }


        closeModal();

        showToast(
          "Song uploaded successfully"
        );


        await Promise.all([
          loadSongs(),
          loadSummary(),
        ]);

      } catch (error) {

        console.error(
          "Upload error:",
          error
        );

        errorEl.textContent =
          error.message ||
          "Unable to upload song.";

        errorEl.classList.remove(
          "hidden"
        );

      } finally {

        submitBtn.disabled =
          false;

        submitBtn.innerHTML =
          `<i class="fa-solid fa-cloud-arrow-up"></i> Upload`;
      }
    }
  );
}


/* =========================================================
   EDIT MODAL
========================================================= */

function openEditModal(song) {

  createModal(
    "Edit Song",
    `
      <form
        id="edit-form"
        class="form"
      >

        <label>
          Title

          <input
            id="edit-title"
            name="title"
            type="text"
            autocomplete="off"
          />
        </label>


        <label>
          Artist

          <input
            id="edit-artist"
            name="artist"
            type="text"
            autocomplete="off"
          />
        </label>


        <label>
          Album

          <input
            id="edit-album"
            name="album"
            type="text"
            autocomplete="off"
          />
        </label>


        <div
          id="edit-error"
          class="error hidden"
        ></div>


        <div class="form-actions">

          <button
            type="submit"
            class="btn primary"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            Save
          </button>

          <button
            type="button"
            id="cancel-edit"
            class="btn"
          >
            Cancel
          </button>

        </div>

      </form>
    `
  );


  document.getElementById(
    "edit-title"
  ).value =
    song.title || "";

  document.getElementById(
    "edit-artist"
  ).value =
    song.artist || "";

  document.getElementById(
    "edit-album"
  ).value =
    song.album || "";


  document
    .getElementById(
      "cancel-edit"
    )
    ?.addEventListener(
      "click",
      closeModal
    );


  const form =
    document.getElementById(
      "edit-form"
    );


  form.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();


      const errorEl =
        document.getElementById(
          "edit-error"
        );


      const saveBtn =
        form.querySelector(
          "button[type='submit']"
        );


      const payload = {

        title:
          form.title.value.trim(),

        artist:
          form.artist.value.trim(),

        album:
          form.album.value.trim(),
      };


      saveBtn.disabled = true;

      saveBtn.innerHTML =
        `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;


      try {

        const response =
          await fetch(
            `${API_URL}/api/admin/songs/${encodeURIComponent(
              song.id
            )}`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );


        if (!response.ok) {

          const data =
            await readJson(
              response
            );

          throw new Error(
            data.message ||
              "Update failed"
          );
        }


        closeModal();

        showToast(
          "Song updated successfully"
        );


        await Promise.all([
          loadSongs(),
          loadSummary(),
        ]);

      } catch (error) {

        console.error(
          "Edit error:",
          error
        );

        errorEl.textContent =
          error.message ||
          "Unable to update song.";

        errorEl.classList.remove(
          "hidden"
        );

      } finally {

        saveBtn.disabled =
          false;

        saveBtn.innerHTML =
          `<i class="fa-solid fa-floppy-disk"></i> Save`;
      }
    }
  );
}


/* =========================================================
   DELETE MODAL
========================================================= */

function openDeleteModal(song) {

  createModal(
    "Delete Song",
    `
      <div class="form">

        <p
          style="
            margin:0;
            color:#a7a7b0;
            font-size:12px;
            line-height:1.5;
          "
        >
          Are you sure you want to delete
          <strong
            id="delete-song-title"
            style="color:#fff"
          ></strong>?
        </p>


        <div
          id="delete-error"
          class="error hidden"
        ></div>


        <div class="form-actions">

          <button
            id="confirm-delete"
            type="button"
            class="btn primary"
          >
            <i class="fa-solid fa-trash"></i>
            Delete
          </button>

          <button
            id="cancel-delete"
            type="button"
            class="btn"
          >
            Cancel
          </button>

        </div>

      </div>
    `
  );


  document.getElementById(
    "delete-song-title"
  ).textContent =
    song.title || "Untitled";


  document
    .getElementById(
      "cancel-delete"
    )
    ?.addEventListener(
      "click",
      closeModal
    );


  document
    .getElementById(
      "confirm-delete"
    )
    ?.addEventListener(
      "click",
      async () => {

        const button =
          document.getElementById(
            "confirm-delete"
          );


        const errorEl =
          document.getElementById(
            "delete-error"
          );


        button.disabled = true;

        button.innerHTML =
          `<i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;


        try {

          const response =
            await fetch(
              `${API_URL}/api/admin/songs/${encodeURIComponent(
                song.id
              )}`,
              {
                method: "DELETE",
              }
            );


          if (!response.ok) {

            const data =
              await readJson(
                response
              );

            throw new Error(
              data.message ||
                "Delete failed"
            );
          }


          closeModal();

          showToast(
            "Song deleted successfully"
          );


          await Promise.all([
            loadSongs(),
            loadSummary(),
          ]);

        } catch (error) {

          console.error(
            "Delete error:",
            error
          );

          errorEl.textContent =
            error.message ||
            "Unable to delete song.";

          errorEl.classList.remove(
            "hidden"
          );

          button.disabled =
            false;

          button.innerHTML =
            `<i class="fa-solid fa-trash"></i> Delete`;
        }
      }
    );
}


/* =========================================================
   ESC CLOSE MODAL
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape"
    ) {

      closeModal();
    }
  }
);


/* =========================================================
   INIT
========================================================= */

async function init() {

  showLoading();

  await Promise.all([
    loadSongs(),
    loadSummary(),
  ]);
}


/* =========================================================
   START
========================================================= */

init();
