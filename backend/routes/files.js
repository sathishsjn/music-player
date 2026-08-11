const express = require("express");
const { GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = require("../config/b2");

const router = express.Router();

// ===============================
// AUDIO FILE
// ===============================

router.get("/audio/:key", async (req, res) => {
    try {
        const key = decodeURIComponent(req.params.key);

        console.log("Audio requested:", key);

        const result = await s3.send(
            new GetObjectCommand({
                Bucket: process.env.B2_BUCKET_NAME,
                Key: key
            })
        );

        res.setHeader(
            "Content-Type",
            result.ContentType || "audio/mpeg"
        );

        if (result.ContentLength) {
            res.setHeader(
                "Content-Length",
                result.ContentLength
            );
        }

        result.Body.pipe(res);

    } catch (error) {
        console.error("Audio File Error:", error);

        res.status(404).json({
            status: "error",
            message: "Audio file not found"
        });
    }
});


// ===============================
// COVER IMAGE
// ===============================

router.get("/cover/:key", async (req, res) => {
    try {
        const key = decodeURIComponent(req.params.key);

        console.log("Cover requested:", key);

        const result = await s3.send(
            new GetObjectCommand({
                Bucket: process.env.B2_BUCKET_NAME,
                Key: key
            })
        );

        res.setHeader(
            "Content-Type",
            result.ContentType || "image/jpeg"
        );

        if (result.ContentLength) {
            res.setHeader(
                "Content-Length",
                result.ContentLength
            );
        }

        result.Body.pipe(res);

    } catch (error) {
        console.error("Cover File Error:", error);

        res.status(404).json({
            status: "error",
            message: "Cover image not found"
        });
    }
});


module.exports = router;

