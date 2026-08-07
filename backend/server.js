const songRoutes = require("./routes/songs");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/songs", songRoutes);

// Test Route
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "Music Player Backend Running 🚀"
    });
});

const supabase = require("./config/supabase");

app.get("/test-db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("songs")
      .select("*")
      .limit(1);

    if (error) {
      return res.json(error);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.json({
      message: err.message,
      cause: err.cause,
      stack: err.stack,
    });
  }
});
// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY);
console.log("URL:", process.env.SUPABASE_URL);
console.log("KEY Length:", process.env.SUPABASE_KEY?.length);
