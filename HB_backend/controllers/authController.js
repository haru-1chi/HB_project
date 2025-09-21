const bcrypt = require('bcrypt');
const db = require('../mysql.js');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "username and password is required" });
  }

  // Find user by username
  db.query('SELECT * FROM user WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ message: err.message });

    if (results.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
    }

    const user = results[0];

    try {
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
      }

      // Create JWT token
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1h' });

      // Remove password before sending response
      const { password: hashedPassword, ...userData } = user;

      return res.status(200).json({
        message: "เข้าสู่ระบบสําเร็จ",
        status: true,
        data: userData,
        token: token
      });

    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
    }
  });
};


exports.createUser = (req, res) => {
  const { username, password, name } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ message: "username, password, and name is required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "กรุณาใส่รหัสผ่านอย่างน้อย 8 ตัวอักษร" });
  }

  // Check if username exists
  db.query('SELECT username FROM user WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ message: err.message });
    if (results.length > 0) return res.status(400).json({ message: "username นี้ มีอยู่ในระบบแล้ว" });

    // Check if name exists
    db.query('SELECT name FROM user WHERE name = ?', [name], async (err, results) => {
      if (err) return res.status(500).json({ message: err.message });
      if (results.length > 0) return res.status(400).json({ message: "ชื่อนี้ มีอยู่ในระบบแล้ว" });

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          'INSERT INTO user (username, password, name, timestamp) VALUES (?, ?, ?, NOW())',
          [username, hashedPassword, name],
          (err) => {
            if (err) return res.status(500).json({ message: err.message });
            res.status(200).json({
              message: "สร้างบัญชีผู้ใช้สำเร็จ",
              status: true,
              data: { username, name }
            });
          }
        );
      } catch (err) {
        return res.status(500).json({ message: err.message });
      }
    });
  });
};

exports.getMe = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.status(200).json({
      status: true,
      data: req.user   // already without password
    });
  } catch (err) {
    return res.status(500).json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
  }
};
