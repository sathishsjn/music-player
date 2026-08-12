const express = require("express");
const db = require("../config/db");
const { extractKeyFromUrl, deleteObject } = require("../utils/b2-utils");
// No auth required: admin routes are public for local/simple admin panel

const router = express.Router();

// Admin auth endpoints (no middleware required)
router.post("/login", async (req, res) => {
  try {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      return res
        .status(500)
        .json({
          status: "error",
          message: "Admin credentials not configured on server",
        });
    }

    if (!req.session) {
      return res
        .status(500)
        .json({
          status: "error",
          message: "Session support not configured on server",
        });
    }

    const { username, password } = req.body || {};
    if (!username || !password)
      return res
        .status(400)
        .json({ status: "error", message: "Missing credentials" });

    // Constant-time compare is more secure for passwords, but here we do a straightforward check
    // and avoid logging sensitive values.
    const valid =
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD;
    if (!valid)
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });

    // Minimal identity in session
    req.session.isAdmin = true;
    req.session.username = process.env.ADMIN_USERNAME;

    return res.json({ status: "success", authenticated: true });
  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ status: "error", message: "Login error" });
  }
});

router.post("/logout", (req, res) => {
  try {
    if (!req.session) {
      return res.json({ status: "success" });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res
          .status(500)
          .json({ status: "error", message: "Failed to destroy session" });
      }

      // Clear the session cookie
      res.clearCookie("connect.sid", { path: "/" });
      return res.json({ status: "success" });
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ status: "error", message: "Logout error" });
  }
});

router.get("/me", (req, res) => {
  try {
    if (req.session && req.session.isAdmin) {
      return res.json({
        authenticated: true,
        username: req.session.username || process.env.ADMIN_USERNAME,
      });
    }

    return res.status(200).json({ authenticated: false });
  } catch (err) {
    console.error("Admin me error:", err);
    return res
      .status(500)
      .json({ status: "error", message: "Session check error" });
  }
});

// GET /api/admin/summary
router.get("/summary", async (req, res) => {
  try {
    const totalRows = await db`SELECT COUNT(*) AS total FROM songs`;
    const total = totalRows && totalRows[0] ? Number(totalRows[0].total) : 0;

    const recent = await db`
      SELECT id, title, artist, album, cover_url, audio_url, duration
      FROM songs
      ORDER BY id DESC
      LIMIT 8
    `;

    return res.json({ status: "success", total, recent });
  } catch (error) {
    console.error("Admin summary error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/admin/songs
router.get("/songs", async (req, res) => {
  try {
    const q = req.query.q ? String(req.query.q).trim() : null;
    const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
    const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : 1000;
    const offset = (page - 1) * limit;

    let rows;

    if (q) {
      const like = `%${q}%`;
      rows = await db`
        SELECT id, title, artist, album, audio_url, cover_url, duration
        FROM songs
        WHERE title ILIKE ${like} OR artist ILIKE ${like} OR album ILIKE ${like}
        ORDER BY id DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    } else {
      rows = await db`
        SELECT id, title, artist, album, audio_url, cover_url, duration
        FROM songs
        ORDER BY id DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `;
    }

    return res.json({ status: "success", count: rows.length, songs: rows });
  } catch (error) {
    console.error("Admin songs error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/admin/songs/:id
router.get("/songs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ status: "error", message: "Invalid id" });

    const rows = await db`
      SELECT id, title, artist, album, audio_url, cover_url, duration
      FROM songs
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows || !rows.length)
      return res
        .status(404)
        .json({ status: "error", message: "Song not found" });

    return res.json({ status: "success", song: rows[0] });
  } catch (error) {
    console.error("Admin song detail error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// DELETE /api/admin/songs/:id
router.delete("/songs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ status: "error", message: "Invalid id" });

    const rows = await db`
      SELECT id, audio_url, cover_url
      FROM songs
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows || !rows.length)
      return res
        .status(404)
        .json({ status: "error", message: "Song not found" });

    const song = rows[0];

    // Extract keys
    const audioKey = extractKeyFromUrl(song.audio_url, "audio");
    const coverKey = extractKeyFromUrl(song.cover_url, "cover");

    // Delete B2 objects if keys found
    const deleteResults = { audio: null, cover: null };

    try {
      if (audioKey) {
        await deleteObject(audioKey);
        deleteResults.audio = "deleted";
      }
    } catch (err) {
      console.error("Failed to delete audio object:", err);
      // abort to avoid DB deletion
      return res
        .status(500)
        .json({ status: "error", message: "Failed to delete audio object" });
    }

    try {
      if (coverKey) {
        await deleteObject(coverKey);
        deleteResults.cover = "deleted";
      }
    } catch (err) {
      console.error("Failed to delete cover object:", err);
      // Note: audio already deleted — at this point we could attempt rollback or report partial failure
      return res
        .status(500)
        .json({ status: "error", message: "Failed to delete cover object" });
    }

    // Delete DB row
    await db`
      DELETE FROM songs WHERE id = ${id}
    `;

    return res.json({
      status: "success",
      message: "Song deleted",
      deleted: deleteResults,
    });
  } catch (error) {
    console.error("Admin delete error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
});

// PUT /api/admin/songs/:id
// Metadata-only update; file replacement can be added later.
router.put("/songs/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id))
      return res.status(400).json({ status: "error", message: "Invalid id" });

    const { title, artist, album } = req.body;

    if (!title && !artist && !album) {
      return res
        .status(400)
        .json({ status: "error", message: "No fields to update" });
    }

    // Update only provided fields
    const existing = await db`
      SELECT id, title, artist, album FROM songs WHERE id = ${id} LIMIT 1
    `;

    if (!existing || !existing.length)
      return res
        .status(404)
        .json({ status: "error", message: "Song not found" });

    const newTitle = title !== undefined ? title : existing[0].title;
    const newArtist = artist !== undefined ? artist : existing[0].artist;
    const newAlbum = album !== undefined ? album : existing[0].album;

    await db`
      UPDATE songs
      SET title = ${newTitle}, artist = ${newArtist}, album = ${newAlbum}
      WHERE id = ${id}
    `;

    const updated = await db`
      SELECT id, title, artist, album, audio_url, cover_url, duration
      FROM songs WHERE id = ${id} LIMIT 1
    `;

    return res.json({ status: "success", song: updated[0] });
  } catch (error) {
    console.error("Admin update error:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
