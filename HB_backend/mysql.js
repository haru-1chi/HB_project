// mysql.js
require('dotenv').config();
const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.CONNECTSQL,
  user: process.env.USERSQL,
  password: process.env.PASSWORDSQL,
  database: process.env.DBSQL
});

// Test connection at startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL connection error:", err);
  } else {
    console.log("✅ Connected to MySQL database");
    connection.release(); // release back to pool
  }
});

module.exports = pool;
