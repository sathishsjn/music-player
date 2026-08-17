// Admin Panel - Direct Access (No Authentication)
const API_URL = "https://music-player-0qp9.onrender.com";

// Elements
const dashboard = document.getElementById("dashboard");
const totalSongsEl = document.getElementById("total-songs");
const recentListEl = document.getElementById("recent-list");
const btnAddSong = document.getElementById("btn-add-song");
const btnRefresh = document.getElementById("btn-refresh");
const searchInput = document.getElementById("search");
const songsContainer = document.getElementById("songs-container");
const emptyState = document.getElementById("empty-state");
const modalRoot = document.getElementById("modal-root");
const toastsRoot = document.getElementById("toasts");

let songs = [];

// Initialize on page load
function init() {
  loadSummary();
  loadSongs();
}

function showToast(msg, time = 4000) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  toastsRoot.appendChild(t);
  setTimeout(() => {
    t.remove();
  }, time);
}

// Load summary data
async function loadSummary() {
  try {
    const res = await fetch(`${API_URL}/api/admin/summary`);
    if (!res.ok) {
      showToast("Failed to load summary");
      return;
    }
    const data = await res.json();
    totalSongsEl.textContent = data.total ?? "—";
    const recent = (data.recent || [])
      .map((s) => s.title)
      .slice(0, 3)
      .join(", ");
    recentListEl.textContent = recent || "—";
  } catch (err) {
    console.error(err);
    showToast("Unable to connect to server");
  }
}

// Load songs list
async function loadSongs() {
  try {
    const res = await fetch(`${API_URL}/api/admin/songs`);
    if (!res.ok) {
      showToast("Failed to load songs");
      return;
    }
    const data = await res.json();
    songs = data.songs || [];
    renderSongs(songs);
  } catch (err) {
    console.error(err);
    showToast("Unable to connect to server");
  }
}

// Render songs
function renderSongs(list) {
  songsContainer.innerHTML = "";
  if (!list || !list.length) {
    emptyState.classList.remove("hidden");
    return;
  } else {
    emptyState.classList.add("hidden");
  }

  list.forEach((song) => {
    const card = document.createElement("div");
    card.className = "card song-card";
    const cover = document.createElement("div");
    cover.className = "song-cover";
    if (song.cover_url)
      cover.style.backgroundImage = `url(${API_URL}${song.cover_url})`;
    const meta = document.createElement("div");
    meta.className = "song-meta";
    const title = document.createElement("div");
    title.className = "song-title";
    title.textContent = song.title || "Untitled";
    const sub = document.createElement("div");
    sub.className = "song-sub";
    sub.textContent = `${song.artist || "-"} • ${song.album || "-"}`;
    const dur = document.createElement("div");
    dur.className = "song-sub";
    dur.textContent = song.duration ? `${song.duration}s` : "";
    meta.appendChild(title);
    meta.appendChild(sub);
    meta.appendChild(dur);

    const actions = document.createElement("div");
    actions.className = "song-actions";
    const editBtn = document.createElement("button");
    editBtn.className = "btn";
    editBtn.textContent = "Edit";
    const delBtn = document.createElement("button");
    delBtn.className = "btn";
    delBtn.textContent = "Delete";

    editBtn.addEventListener("click", () => openEditModal(song));
    delBtn.addEventListener("click", () => openDeleteModal(song));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(cover);
    card.appendChild(meta);
    card.appendChild(actions);
    songsContainer.appendChild(card);
  });
}

// Search functionality
searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) return renderSongs(songs);
  const filtered = songs.filter((s) =>
    ((s.title || "") + " " + (s.artist || "") + " " + (s.album || ""))
      .toLowerCase()
      .includes(q),
  );
  renderSongs(filtered);
});

// Refresh buttons
btnRefresh.addEventListener("click", () => {
  loadSummary();
  loadSongs();
  showToast("Refreshed");
});
document
  .getElementById("refresh-songs")
  .addEventListener("click", () => loadSongs());
document.getElementById("btn-manage-songs").addEventListener("click", () => {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
});
btnAddSong.addEventListener("click", () => openAddModal());

// ==========================================
// MODALS
// ==========================================

function closeModal() {
  modalRoot.innerHTML = "";
}

function openAddModal() {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal">
        <h3>Add Song</h3>
        <form id="add-form" class="form">
          <label>Title<input name="title" required></label>
          <label>Artist<input name="artist"></label>
          <label>Album<input name="album"></label>
          <label>Audio File<input name="song" type="file" accept="audio/*" required></label>
          <label>Cover Image<input name="cover" type="file" accept="image/*"></label>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button type="submit" class="btn primary">Upload</button>
            <button type="button" id="cancel-add" class="btn">Cancel</button>
          </div>
          <div id="add-error" class="error" hidden></div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("cancel-add").addEventListener("click", closeModal);
  document.getElementById("add-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData();
    const title = form.title.value.trim();
    const artist = form.artist.value.trim();
    const album = form.album.value.trim();
    const songFile = form.song.files[0];
    const coverFile = form.cover.files[0];
    if (!songFile) {
      document.getElementById("add-error").textContent = "Audio file required";
      document.getElementById("add-error").hidden = false;
      return;
    }

    fd.append("title", title);
    fd.append("artist", artist);
    fd.append("album", album);
    fd.append("song", songFile);
    if (coverFile) fd.append("cover", coverFile);

    try {
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Uploading...";
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: fd,
      });
      if (res.status === 201) {
        showToast("Song uploaded");
        closeModal();
        await loadSongs();
        await loadSummary();
      } else {
        const p = await res.json().catch(() => ({}));
        document.getElementById("add-error").textContent =
          p.message || "Upload failed";
        document.getElementById("add-error").hidden = false;
      }
    } catch (err) {
      document.getElementById("add-error").textContent =
        "Unable to connect to server";
      document.getElementById("add-error").hidden = false;
    } finally {
      const btn = form.querySelector("button[type=submit]");
      btn.disabled = false;
      btn.textContent = "Upload";
    }
  });
}

function openEditModal(song) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal">
        <h3>Edit Song</h3>
        <form id="edit-form" class="form">
          <label>Title<input name="title" value="${escapeHtml(song.title || "")}"></label>
          <label>Artist<input name="artist" value="${escapeHtml(song.artist || "")}"></label>
          <label>Album<input name="album" value="${escapeHtml(song.album || "")}"></label>
          <div style="display:flex;gap:8px;margin-top:12px">
            <button type="submit" class="btn primary">Save</button>
            <button type="button" id="cancel-edit" class="btn">Cancel</button>
          </div>
          <div id="edit-error" class="error" hidden></div>
        </form>
      </div>
    </div>
  `;

  document.getElementById("cancel-edit").addEventListener("click", closeModal);
  document.getElementById("edit-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      title: form.title.value.trim(),
      artist: form.artist.value.trim(),
      album: form.album.value.trim(),
    };
    try {
      const res = await fetch(`${API_URL}/api/admin/songs/${song.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 200) {
        showToast("Song updated");
        closeModal();
        await loadSongs();
      } else {
        const p = await res.json().catch(() => ({}));
        document.getElementById("edit-error").textContent =
          p.message || "Update failed";
        document.getElementById("edit-error").hidden = false;
      }
    } catch (err) {
      document.getElementById("edit-error").textContent =
        "Unable to connect to server";
      document.getElementById("edit-error").hidden = false;
    }
  });
}

function openDeleteModal(song) {
  modalRoot.innerHTML = `
    <div class="modal-backdrop" role="dialog" aria-modal="true">
      <div class="modal">
        <h3>Delete Song</h3>
        <p>Are you sure you want to delete <strong>${escapeHtml(song.title || "Untitled")}</strong>?</p>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button id="confirm-delete" class="btn primary">Delete</button>
          <button id="cancel-delete" class="btn">Cancel</button>
        </div>
        <div id="delete-error" class="error" hidden></div>
      </div>
    </div>
  `;

  document
    .getElementById("cancel-delete")
    .addEventListener("click", closeModal);
  document
    .getElementById("confirm-delete")
    .addEventListener("click", async () => {
      const btn = document.getElementById("confirm-delete");
      btn.disabled = true;
      btn.textContent = "Deleting...";
      try {
        const res = await fetch(`${API_URL}/api/admin/songs/${song.id}`, {
          method: "DELETE",
        });
        if (res.status === 200) {
          showToast("Song deleted");
          closeModal();
          await loadSongs();
          await loadSummary();
        } else if (res.status === 404) {
          document.getElementById("delete-error").textContent =
            "Song not found";
          document.getElementById("delete-error").hidden = false;
        } else {
          const p = await res.json().catch(() => ({}));
          document.getElementById("delete-error").textContent =
            p.message || "Delete failed";
          document.getElementById("delete-error").hidden = false;
        }
      } catch (err) {
        document.getElementById("delete-error").textContent =
          "Unable to connect to server";
        document.getElementById("delete-error").hidden = false;
      } finally {
        btn.disabled = false;
        btn.textContent = "Delete";
      }
    });
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

// Initialize
init();
