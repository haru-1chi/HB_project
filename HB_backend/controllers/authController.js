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

    const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '12h' });

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
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: "กรุณาระบุสิทธิ์การใช้งาน (role)" });
    }

    // ✅ Works correctly with mysql (not mysql2)
    const result = await query(
      "SELECT COUNT(*) AS count FROM user WHERE username LIKE 'user%'"
    );
    const count = result[0]?.count || 0;

    const nextNum = String(count + 1).padStart(2, "0");
    const newUsername = `user${nextNum}`;

    const rawPassword = newUsername;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await query(
      `INSERT INTO user (username, password, name, verify, role)
       VALUES (?, ?, ?, 0, ?)`,
      [newUsername, hashedPassword, "", role]
    );

    return res.status(200).json({
      status: true,
      message: "สร้างบัญชีผู้ใช้สำเร็จ",
      data: {
        username: newUsername,
        password: rawPassword,
        name: "",
        verify: 0,
        role,
      },
    });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({ message: "เกิดข้อผิดพลาดภายในระบบ" });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { username, password, confirm_password, name, verify = 0 } = req.body;

    if (!username?.trim() || !password || !confirm_password || !name?.trim()) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });
    }

    const [existing] = await query(
      "SELECT 1 FROM user WHERE username = ? LIMIT 1",
      [username]
    );
    if (existing) {
      return res.status(400).json({ message: "username นี้มีอยู่แล้ว" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      `INSERT INTO user (username, password, name, verify, role, updated_at)
       VALUES (?, ?, ?, ?, 'user', NOW())`,
      [username.trim(), hashedPassword, name.trim(), verify]
    );

    return res.status(201).json({
      status: true,
      message: "สร้างบัญชีผู้ใช้สำเร็จ",
      data: { username, name, verify, role: "user" },
    });
  } catch (err) {
    console.error("createAccount error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในระบบ" });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { username, newUsername, name, role } = req.body;

    if (!username) {
      return res.status(400).json({ message: "กรุณาระบุ username" });
    }

    const [user] = await query(
      "SELECT username, name, role FROM user WHERE username = ? LIMIT 1",
      [username]
    );

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
    }

    const updatedUsername = newUsername?.trim() || user.username;
    const updatedName = name?.trim() || user.name;
    const updatedRole = role ?? user.role;

    if (updatedUsername !== user.username || updatedName !== user.name) {
      const [duplicate] = await query(
        `SELECT username, name 
         FROM user 
         WHERE (username = ? OR name = ?) AND username != ? 
         LIMIT 1`,
        [updatedUsername, updatedName, username]
      );

      if (duplicate) {
        if (duplicate.username === updatedUsername) {
          return res.status(400).json({ message: "username นี้มีอยู่แล้ว" });
        }
        if (duplicate.name === updatedName) {
          return res.status(400).json({ message: "ชื่อนี้มีอยู่แล้ว" });
        }
      }
    }

    if (
      updatedUsername !== user.username ||
      updatedName !== user.name ||
      updatedRole !== user.role
    ) {
      await query(
        `UPDATE user 
         SET username = ?, name = ?, role = ?, updated_at = NOW() 
         WHERE username = ?`,
        [updatedUsername, updatedName, updatedRole, username]
      );
    }

    const token = updatedUsername !== user.username
      ? jwt.sign({ username: updatedUsername }, process.env.JWT_SECRET || "secret_key", { expiresIn: "12h" })
      : null;

    res.status(200).json({
      message: "อัปเดตข้อมูลผู้ใช้สำเร็จ",
      data: {
        username: updatedUsername,
        name: updatedName,
        role: updatedRole,
      },
      ...(token && { token }),
    });
  } catch (err) {
    console.error("updateUser error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในระบบ" });
  }
};


exports.updatePassword = async (req, res) => {
  try {
    const { username, current_password, new_password, confirm_password } = req.body;

    if (!username || !current_password || !new_password || !confirm_password) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    const [user] = await query("SELECT * FROM user WHERE username = ? LIMIT 1", [username]);
    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
    }

    const match = await bcrypt.compare(current_password, user.password);
    if (!match) {
      return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ไม่ตรงกัน" });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" });
    }

    const hashedNew = await bcrypt.hash(new_password, 10);
    await query(
      "UPDATE user SET password = ?, updated_at = NOW() WHERE username = ?",
      [hashedNew, username]
    );

    res.status(200).json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
  } catch (err) {
    console.error("updatePassword error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในระบบ" });
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
