const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const db = require("./config/db");
const songRoutes = require("./routes/songs");
const uploadRoutes = require("./routes/upload");
const fileRoutes = require("./routes/files");

const app = express();

// =========================
// Middleware
// =========================

app.use(cors());
app.use(express.json());

// =========================
// Static Upload Files
// =========================

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);

// =========================
// Songs Route
// =========================

app.use("/api/songs", songRoutes);

// =========================
// Upload Route
// =========================

app.use("/api/upload", uploadRoutes);

// =========================
// r3 new Route
// =========================

app.use("/api/files", fileRoutes);


// =========================
// Home Route
// =========================

app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "Music Player Backend Running 🚀"
    });
});

// =========================
// MySQL Test
// =========================

app.get("/test-db", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT 1 AS test"
        );

        res.json({
            status: "success",
            message: "MySQL Connected 🚀",
            data: rows
        });

    } catch (error) {
        console.error("MySQL Error:", error);

        res.status(500).json({
            status: "error",
            message: error.message
        });
    }
});

// =========================
// 404 Route
// =========================

app.use((req, res) => {
    res.status(404).json({
        status: "error",
        message: "Route Not Found"
    });
});

// =========================
// Start Server
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `🚀 Server running at http://localhost:${PORT}`
    );
});
