const express = require("express");
const multer = require("multer");
const path = require("path");

const { PutObjectCommand } = require("@aws-sdk/client-s3");

const db = require("../config/db");
const s3 = require("../config/b2");

const router = express.Router();

// ===============================
// TEST ROUTE
// ===============================

router.get("/test", (req, res) => {
  res.json({
    status: "success",
    message: "Upload route is working 🚀",
  });
});

// ===============================
// MULTER
// ===============================

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "song") {
    if (file.mimetype === "audio/mpeg") {
      cb(null, true);
    } else {
      cb(new Error("Only MP3 files are allowed"));
    }
  } else if (file.fieldname === "cover") {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  } else {
    cb(new Error("Invalid file field"));
  }
};

const upload = multer({
  storage: storage,

  fileFilter: fileFilter,

  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

// ===============================
// UPLOAD SONG
// ===============================

router.post(
  "/",

  upload.fields([
    {
      name: "song",
      maxCount: 1,
    },
    {
      name: "cover",
      maxCount: 1,
    },
  ]),

  async (req, res) => {
    try {
      const { title, artist, album, duration } = req.body;

      // Check MP3

      if (!req.files || !req.files.song) {
        return res.status(400).json({
          status: "error",
          message: "MP3 song is required",
        });
      }

      const songFile = req.files.song[0];

      const coverFile = req.files.cover ? req.files.cover[0] : null;

      // ===============================
      // CREATE UNIQUE FILE NAMES
      // ===============================

      const timestamp = Date.now();

      const randomNumber = Math.round(Math.random() * 1e9);

      const songName = `${timestamp}-${randomNumber}${path.extname(songFile.originalname)}`;

      const coverName = coverFile
        ? `${timestamp}-${randomNumber}-cover${path.extname(coverFile.originalname)}`
        : null;

      // ===============================
      // B2 OBJECT KEYS
      // ===============================

      const songKey = `songs/${songName}`;

      const coverKey = coverName ? `covers/${coverName}` : null;

      // ===============================
      // UPLOAD MP3 TO B2
      // ===============================

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.B2_BUCKET_NAME,

          Key: songKey,

          Body: songFile.buffer,

          ContentType: "audio/mpeg",
        }),
      );

      // ===============================
      // UPLOAD COVER TO B2
      // ===============================

      if (coverFile) {
        await s3.send(
          new PutObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME,

            Key: coverKey,

            Body: coverFile.buffer,

            ContentType: coverFile.mimetype,
          }),
        );
      }

      // ===============================
      // CONVERT DURATION TO SECONDS
      // ===============================

      let durationSeconds = null;

      if (duration) {
        const parts = duration.split(":");

        if (parts.length === 2) {
          const minutes = parseInt(parts[0], 10);
          const seconds = parseInt(parts[1], 10);

          if (!isNaN(minutes) && !isNaN(seconds)) {
            durationSeconds = minutes * 60 + seconds;
          }
        }
      }

      // ===============================
      // BACKEND FILE URL
      // ===============================

      const audioUrl = `/api/files/audio?key=${encodeURIComponent(songKey)}`;

      const coverUrl = coverKey
        ? `/api/files/cover?key=${encodeURIComponent(coverKey)}`
        : null;

      // ===============================
      // INSERT INTO NEON
      // ===============================

      const result = await db`
                INSERT INTO songs
                (
                    title,
                    artist,
                    album,
                    audio_url,
                    cover_url,
                    duration
                )
                VALUES
                (
                    ${title},
                    ${artist},
                    ${album},
                    ${audioUrl},
                    ${coverUrl},
                    ${durationSeconds}
                )
                RETURNING id
            `;

      // ===============================
      // RESPONSE
      // ===============================

      res.status(201).json({
        status: "success",

        message: "Song uploaded successfully 🎵",

        song: {
          id: result[0].id,

          title,

          artist,

          album,

          audio_url: audioUrl,

          cover_url: coverUrl,

          duration,
        },
      });
    } catch (error) {
      console.error("Upload Error:", error);

      res.status(500).json({
        status: "error",

        message: error.message,
      });
    }
  },
);

module.exports = router;
