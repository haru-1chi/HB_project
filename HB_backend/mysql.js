// mysql.js
require("dotenv").config();
const mysql = require("mysql2/promise"); //แก้เป็น mysql2

const pool = mysql.createPool({
  host: process.env.CONNECTSQL,
  user: process.env.USERSQL,
  password: process.env.PASSWORDSQL,
  database: process.env.DBSQL,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "+07:00",     // ✅ match Thailand timezone
  dateStrings: true,
});

// Test connection at startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ Connected to MySQL database");
    conn.release();
  } catch (err) {
    console.error("❌ MySQL connection error:", err);
  }
})();

module.exports = pool;
