// db.js
require('dotenv').config();
const mysql = require('mysql');
// const { USER, PASSWORD, CONNECT } = require('./config/index');

const dbConfig = {
  user: process.env.USERSQL,
  host: process.env.CONNECTSQL,
  password: process.env.PASSWORDSQL,
  database: process.env.DBSQL
};

const db = mysql.createConnection(dbConfig);

// Connect once at start
db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    throw err;
  }
  console.log("Connected to MySQL database");
});

module.exports = db;
