const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set — DB operations will be no-ops in this environment.",
  );

  // Export a minimal stub that can be awaited in places where the real sql tagged
  // template would be used. This avoids throwing on require() so auth/session
  // setup can be tested without a database configured.
  const stub = function () {
    return Promise.resolve([]);
  };

  // Provide a query method for any code expecting db.query
  stub.query = async function () {
    return [];
  };

  module.exports = stub;
} else {
  const sql = neon(process.env.DATABASE_URL);
  console.log("✅ Neon Serverless Database Ready");
  module.exports = sql;
}
