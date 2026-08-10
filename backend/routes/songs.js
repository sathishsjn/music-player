const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {

    try {

        const [rows] = await db.query(`
            SELECT
                id,
                title,
                artist,
                album,
                audio_url,
                cover_url,
                duration
            FROM songs
            ORDER BY id DESC
        `);

        res.json({
            status: "success",
            count: rows.length,
            songs: rows
        });

    } catch (error) {

        console.error("Songs Error:", error);

        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

module.exports = router;
