const express = require("express");
const { GetObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

const s3 = require("../config/b2");

const router = express.Router();

// Files are uploaded with unique timestamp+random keys (see routes/upload.js)
// and are never overwritten under the same key, so immutable caching is safe.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

/**
 * Parse a single HTTP byte-range header.
 *
 * Supports:
 *   bytes=0-999999      (start-end)
 *   bytes=1000000-      (start to end of file)
 *   bytes=-1000000      (last N bytes)
 *
 * Returns { start, end } for a valid range.
 * Returns { error: "invalid" } or { error: "unsatisfiable" } for a
 * malformed / out-of-bounds range.
 * Returns null when no Range header is present.
 */
function parseRange(rangeHeader, totalSize) {
    if (!rangeHeader) return null;

    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match) return { error: "invalid" };

    let start = match[1] === "" ? null : parseInt(match[1], 10);
    let end = match[2] === "" ? null : parseInt(match[2], 10);

    if (Number.isNaN(start)) start = null;
    if (Number.isNaN(end)) end = null;

    // Suffix range: bytes=-N  →  last N bytes of the file
    if (start === null) {
        const suffix = end;
        if (suffix === null || suffix === 0) return { error: "invalid" };
        start = Math.max(totalSize - suffix, 0);
        end = totalSize - 1;
    } else {
        if (start < 0 || start >= totalSize) {
            return { error: "unsatisfiable" };
        }
        if (end === null || end >= totalSize) end = totalSize - 1;
        if (start > end) return { error: "invalid" };
    }

    return { start, end };
}

/**
 * Get the object size without downloading the body.
 */
async function getObjectSize(key) {
    const head = await s3.send(
        new HeadObjectCommand({
            Bucket: process.env.B2_BUCKET_NAME,
            Key: key
        })
    );
    return head.ContentLength;
}

/**
 * True when the error is due to an aborted/cancelled request.
 */
function isAbortError(error) {
    return (
        error &&
        (error.name === "AbortError" || error.name === "RequestAbortedError")
    );
}

/**
 * Abort the upstream B2 request if the client disconnects before the
 * response completes (close player, skip song, refresh, cancel range).
 */
function abortOnDisconnect(req, res, controller) {
    const onClose = () => {
        if (!res.writableEnded) controller.abort();
    };
    res.on("close", onClose);
    return () => res.removeListener("close", onClose);
}

/**
 * Stream the S3 body directly to the Express response.
 * Never buffers the whole file into memory.
 */
function streamResponse(req, res, result, controller) {
    return new Promise((resolve) => {
        let settled = false;
        const done = () => {
            if (!settled) {
                settled = true;
                resolve();
            }
        };

        res.on("finish", done);
        res.on("close", done);

        result.Body.on("error", () => {
            controller.abort();
            if (!res.writableEnded) res.destroy();
            done();
        });

        result.Body.pipe(res);
    });
}

/**
 * Send a clean JSON error without exposing internal details.
 */
function sendError(res, status, message) {
    if (res.headersSent) {
        res.destroy();
        return;
    }
    res.status(status).json({ status: "error", message });
}

// ===============================
// AUDIO FILE
// ===============================

router.get("/audio/:key", async (req, res) => {
    const controller = new AbortController();
    const cleanup = abortOnDisconnect(req, res, controller);

    let key;
    try {
        key = decodeURIComponent(req.params.key);
    } catch {
        cleanup();
        return sendError(res, 400, "Invalid audio file key");
    }

    try {
        const commandParams = {
            Bucket: process.env.B2_BUCKET_NAME,
            Key: key,
            abortSignal: controller.signal
        };

        const rangeHeader = req.headers.range;

        // ---------- Range request ----------
        if (rangeHeader) {
            // We must know the total size to validate the range, so use a
            // cheap HeadObject instead of downloading the whole object.
            const totalSize = await getObjectSize(key);
            const range = parseRange(rangeHeader, totalSize);

            if (range?.error) {
                res.setHeader("Content-Range", `bytes */${totalSize}`);
                sendError(res, 416, "Range not satisfiable");
                return;
            }

            commandParams.Range = `bytes=${range.start}-${range.end}`;

            const result = await s3.send(new GetObjectCommand(commandParams));

            res.status(206);
            res.setHeader("Accept-Ranges", "bytes");
            res.setHeader(
                "Content-Range",
                `bytes ${range.start}-${range.end}/${totalSize}`
            );
            res.setHeader("Content-Length", range.end - range.start + 1);
            res.setHeader(
                "Content-Type",
                result.ContentType || "audio/mpeg"
            );
            res.setHeader("Cache-Control", CACHE_CONTROL);

            await streamResponse(req, res, result, controller);
            return;
        }

        // ---------- Full request ----------
        const result = await s3.send(new GetObjectCommand(commandParams));

        res.status(200);
        res.setHeader("Accept-Ranges", "bytes");
        // No HeadObject needed when GetObject already provides ContentLength.
        if (result.ContentLength) {
            res.setHeader("Content-Length", result.ContentLength);
        }
        res.setHeader("Content-Type", result.ContentType || "audio/mpeg");
        res.setHeader("Cache-Control", CACHE_CONTROL);

        await streamResponse(req, res, result, controller);
    } catch (error) {
        if (isAbortError(error) || res.destroyed) {
            return; // client disconnected — nothing more to send
        }
        if (res.headersSent) {
            res.destroy();
            return;
        }
        console.error("Audio File Error:", error);
        if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
            sendError(res, 404, "Audio file not found");
        } else {
            sendError(res, 500, "Unable to retrieve audio file");
        }
    } finally {
        cleanup();
    }
});

// ===============================
// COVER IMAGE
// ===============================

router.get("/cover/:key", async (req, res) => {
    const controller = new AbortController();
    const cleanup = abortOnDisconnect(req, res, controller);

    let key;
    try {
        key = decodeURIComponent(req.params.key);
    } catch {
        cleanup();
        return sendError(res, 400, "Invalid cover image key");
    }

    try {
        const result = await s3.send(
            new GetObjectCommand({
                Bucket: process.env.B2_BUCKET_NAME,
                Key: key,
                abortSignal: controller.signal
            })
        );

        res.status(200);
        if (result.ContentLength) {
            res.setHeader("Content-Length", result.ContentLength);
        }
        res.setHeader(
            "Content-Type",
            result.ContentType || "image/jpeg"
        );
        res.setHeader("Cache-Control", CACHE_CONTROL);

        await streamResponse(req, res, result, controller);
    } catch (error) {
        if (isAbortError(error) || res.destroyed) {
            return; // client disconnected — nothing more to send
        }
        if (res.headersSent) {
            res.destroy();
            return;
        }
        console.error("Cover File Error:", error);
        if (error?.name === "NoSuchKey" || error?.$metadata?.httpStatusCode === 404) {
            sendError(res, 404, "Cover image not found");
        } else {
            sendError(res, 500, "Unable to retrieve cover image");
        }
    } finally {
        cleanup();
    }
});

module.exports = router;
