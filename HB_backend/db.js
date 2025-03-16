// db.js
const oracledb = require('oracledb');
const { USER, PASSWORD, CONNECT } = require('./config/index');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

const dbConfig = {
  user: USER,
  password: PASSWORD,
  connectString: CONNECT
};

async function getConnection() {
  try {
    return await oracledb.getConnection(dbConfig);
  } catch (err) {
    console.error('Database connection error:', err);
    throw err;
  }
}

module.exports = { getConnection };
