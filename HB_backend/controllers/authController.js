const bcrypt = require('bcrypt');
const db = require('../mysql.js');
const jwt = require('jsonwebtoken');
const util = require('util');

const query = util.promisify(db.query).bind(db);

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "username and password is required" });
    }

    const results = await query('SELECT * FROM user WHERE username = ? LIMIT 1', [username]);

    if (results.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

    delete user.password;

    return res.status(200).json({
      message: "เข้าสู่ระบบสําเร็จ",
      status: true,
      data: user,
      token,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
  }
};


exports.createUser = async (req, res) => {
  try {
    const { username, password, name } = req.body;

    // ✅ 1. Input validation
    if (!username || !password || !name) {
      return res.status(400).json({ message: "username, password, and name is required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "กรุณาใส่รหัสผ่านอย่างน้อย 8 ตัวอักษร" });
    }

    // ✅ 2. Single query for duplicate check
    const [existingUser] = await query(
      "SELECT username, name FROM user WHERE username = ? OR name = ? LIMIT 1",
      [username, name]
    );

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: "username นี้ มีอยู่ในระบบแล้ว" });
      }
      if (existingUser.name === name) {
        return res.status(400).json({ message: "ชื่อนี้ มีอยู่ในระบบแล้ว" });
      }
    }

    // ✅ 3. Hash password asynchronously
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ 4. Insert user
    await query(
      "INSERT INTO user (username, password, name, timestamp) VALUES (?, ?, ?, NOW())",
      [username, hashedPassword, name]
    );

    // ✅ 5. Send clean response
    return res.status(201).json({
      message: "สร้างบัญชีผู้ใช้สำเร็จ",
      status: true,
      data: { username, name },
    });

  } catch (error) {
    console.error("CreateUser error:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในระบบ" });
  }
};

exports.getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    return res.status(200).json({
      status: true,
      data: req.user   // already without password
    });
  } catch (err) {
    return res.status(500).json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
  }
};
