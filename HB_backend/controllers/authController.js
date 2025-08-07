const bcrypt = require('bcrypt');
const { pool } = require('../mysql');
const jwt = require('jsonwebtoken');
const SECRET = 'your_intranet_safe_secret';

async function createUser(req, res) {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: 'Missing username or password' });

  const hashed = await bcrypt.hash(password, 10);
  await pool.query('INSERT INTO user (username, password, timestamp) VALUES (?, ?, NOW())', [username, hashed]);
  res.json({ message: 'User created successfully' });
}



async function login(req, res) {
  const { username, password } = req.body;
  const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username]);

  if (!rows.length) return res.status(401).json({ message: 'User not found' });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) return res.status(401).json({ message: 'Invalid password' });

  const token = jwt.sign({ username: user.username }, SECRET, { expiresIn: '1h' });

  await pool.query('INSERT INTO token (username, token, timestamp) VALUES (?, ?, NOW())', [user.username, token]);

  res.json({ token });
}

async function logout(req, res) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(400).json({ message: 'No token provided' });

  await pool.query('INSERT INTO blacklist (token, timestamp) VALUES (?, NOW())', [token]);
  res.json({ message: 'Logged out' });
}
