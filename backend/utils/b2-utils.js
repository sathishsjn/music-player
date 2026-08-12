const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
const s3 = require("../config/b2");

function extractKeyFromUrl(url, type) {
  // Expected formats stored in DB: /api/files/audio/:key or /api/files/cover/:key
  if (!url || typeof url !== "string") return null;

  try {
    const audioPrefix = "/api/files/audio/";
    const coverPrefix = "/api/files/cover/";

    if (type === "audio" && url.startsWith(audioPrefix)) {
      const encoded = url.slice(audioPrefix.length);
      const key = decodeURIComponent(encoded);
      // safety check: only allow keys under songs/
      if (key.startsWith("songs/")) return key;
      return null;
    }

    if (type === "cover" && url.startsWith(coverPrefix)) {
      const encoded = url.slice(coverPrefix.length);
      const key = decodeURIComponent(encoded);
      if (key.startsWith("covers/")) return key;
      return null;
    }

    return null;
  } catch (err) {
    return null;
  }
}

async function deleteObject(key) {
  if (!key) throw new Error("Invalid key");

  const cmd = new DeleteObjectCommand({
    Bucket: process.env.B2_BUCKET_NAME,
    Key: key,
  });

  return s3.send(cmd);
}

module.exports = { extractKeyFromUrl, deleteObject };
