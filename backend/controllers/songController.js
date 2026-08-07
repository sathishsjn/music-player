// const supabase = require("../config/supabase");

// const getAllSongs = async (req, res) => {
//   try {
//     const { data, error } = await supabase
//       .from("songs")
//       .select("*")
//       .order("created_at", { ascending: false });

//     if (error) {
//       console.error("Supabase Error:", error);

//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       count: data.length,
//       songs: data,
//     });

//   } catch (err) {
//     console.error("Catch Error:", err);

//     res.status(500).json({
//       success: false,
//       message: err.message,
//       stack: err.stack,
//     });
//   }
// };

// module.exports = {
//   getAllSongs,
// };

const supabase = require("../config/supabase");

const getAllSongs = async (req, res) => {
  const result = await supabase.from("songs").select("*");

  console.log(result);

  res.json(result);
};

module.exports = { getAllSongs };
