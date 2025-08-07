// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../mysql');
const SECRET = 'your_intranet_safe_secret';

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(403);

  // Check blacklist
  const [bl] = await pool.query('SELECT * FROM blacklist WHERE token = ?', [token]);
  if (bl.length) return res.sendStatus(403);

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}

module.exports = verifyToken;
