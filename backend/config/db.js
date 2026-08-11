const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

console.log("✅ Neon Serverless Database Ready");

module.exports = sql;
