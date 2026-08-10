const mysql = require("mysql2");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "12345",
    database: "music_player",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ MySQL Connection Failed:", err.message);
        return;
    }

    console.log("✅ MySQL Connected Successfully");
    connection.release();
});

module.exports = pool.promise();
