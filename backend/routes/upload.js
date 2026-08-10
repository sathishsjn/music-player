const express = require("express");
const multer = require("multer");
const path = require("path");

const db = require("../config/db");

const router = express.Router();

router.get("/test", (req, res) => {
    res.json({
        status: "success",
        message: "Upload route is working 🚀"
    });
});

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        if (file.fieldname === "song") {

            cb(
                null,
                path.join(__dirname, "../uploads/songs")
            );

        } else if (file.fieldname === "cover") {

            cb(
                null,
                path.join(__dirname, "../uploads/covers")
            );

        } else {

            cb(new Error("Invalid file field"));

        }
    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});


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
        fileSize: 50 * 1024 * 1024
    }

});


router.post(
    "/",
    upload.fields([
        {
            name: "song",
            maxCount: 1
        },
        {
            name: "cover",
            maxCount: 1
        }
    ]),

    async (req, res) => {

        try {

            const {
                title,
                artist,
                album,
                duration
            } = req.body;


            if (!req.files || !req.files.song) {

                return res.status(400).json({
                    status: "error",
                    message: "MP3 song is required"
                });

            }


            const songFile = req.files.song[0];

            const coverFile =
                req.files.cover
                    ? req.files.cover[0]
                    : null;


            const audioUrl =
                `/uploads/songs/${songFile.filename}`;


            const coverUrl =
                coverFile
                    ? `/uploads/covers/${coverFile.filename}`
                    : null;


            const [result] = await db.query(

                `INSERT INTO songs
                (title, artist, album, audio_url, cover_url, duration)
                VALUES (?, ?, ?, ?, ?, ?)`,

                [
                    title,
                    artist,
                    album,
                    audioUrl,
                    coverUrl,
                    duration
                ]

            );


            res.status(201).json({

                status: "success",

                message: "Song uploaded successfully 🎵",

                song: {
                    id: result.insertId,
                    title,
                    artist,
                    album,
                    audio_url: audioUrl,
                    cover_url: coverUrl,
                    duration
                }

            });

        } catch (error) {

            console.error("Upload Error:", error);

            res.status(500).json({
                status: "error",
                message: error.message
            });

        }

    }
);


module.exports = router;
