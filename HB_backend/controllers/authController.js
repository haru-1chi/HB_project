const bcrypt = require('bcrypt');
const db = require('../mysql.js');
const jwt = require('jsonwebtoken');
const util = require('util');

const query = util.promisify(db.query).bind(db);

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

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

    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '12h' });

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

    const results = await query("SELECT id FROM user ORDER BY id DESC LIMIT 1");
    const latest = results.length ? results[0] : null;

    const nextNum = String((latest?.id || 0) + 1).padStart(2, "0");
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
    const { username, newUsername, name, password, confirm_password } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ message: "ไม่พบ username ปัจจุบัน" });
    }
    if (!name?.trim()) {
      return res.status(400).json({ message: "กรุณาระบุชื่อ" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" });
    }

    const existingResult = await query(
      "SELECT id, username, password, role FROM user WHERE username = ? LIMIT 1",
      [username]
    );
    const existingUser = existingResult.length ? existingResult[0] : null;

    if (!existingUser) {
      return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้" });
    }

    const updatedUsername = newUsername?.trim() || username;
    const updatedName = name.trim();

    if (updatedUsername !== username) {
      const dupResult = await query(
        "SELECT 1 FROM user WHERE username = ? LIMIT 1",
        [updatedUsername]
      );
      if (dupResult.length > 0) {
        return res.status(400).json({ message: "username นี้ถูกใช้แล้ว" });
      }
    }

    let hashedPassword = existingUser.password;
    if (password) {
      if (password !== confirm_password) {
        return res.status(400).json({ message: "รหัสผ่านไม่ตรงกัน" });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updateResult = await query(
      `
      UPDATE user
      SET username = ?, password = ?, name = ?, verify = 1, updated_at = NOW()
      WHERE id = ?
      `,
      [updatedUsername, hashedPassword, updatedName, existingUser.id]
    );

    if (!updateResult.affectedRows) {
      return res.status(500).json({ message: "อัปเดตข้อมูลไม่สำเร็จ" });
    }

    const newToken =
      updatedUsername !== username
        ? jwt.sign(
          { username: updatedUsername },
          JWT_SECRET,
          { expiresIn: "12h" }
        )
        : null;

    res.status(200).json({
      message: "อัปเดตข้อมูลผู้ใช้สำเร็จ",
      data: {
        username: updatedUsername,
        name: updatedName,
        role: existingUser.role,
        verify: 1,
      },
      ...(newToken && { token: newToken }),
    });
  } catch (err) {
    console.error("updateAccount error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดภายในระบบ" });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const { username, newUsername, name, role } = req.body;

    if (!username?.trim()) {
      return res.status(400).json({ message: "กรุณาระบุ username" });
    }

    const userResult = await query(
      "SELECT id, username, name, role FROM user WHERE username = ? LIMIT 1",
      [username]
    );
    const user = userResult.length ? userResult[0] : null;

    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
    }

    const updatedUsername = newUsername?.trim() || user.username;
    const updatedName = name?.trim() || user.name;
    const updatedRole = role ?? user.role;

    const hasChanges =
      updatedUsername !== user.username ||
      updatedName !== user.name ||
      updatedRole !== user.role;

    if (!hasChanges) {
      return res.status(200).json({
        message: "ไม่มีการเปลี่ยนแปลงข้อมูล",
        data: user,
      });
    }

    const conflictResult = await query(
      `SELECT username, name 
       FROM user 
       WHERE (username = ? OR name = ?) 
         AND username != ? 
       LIMIT 1`,
      [updatedUsername, updatedName, user.username]
    );
    const conflict = conflictResult.length ? conflictResult[0] : null;

    if (conflict) {
      if (conflict.username === updatedUsername) {
        return res.status(400).json({ message: "username นี้มีอยู่แล้ว" });
      }
      if (conflict.name === updatedName) {
        return res.status(400).json({ message: "ชื่อนี้มีอยู่แล้ว" });
      }
    }

    const updateResult = await query(
      `UPDATE user 
       SET username = ?, name = ?, role = ?, updated_at = NOW() 
       WHERE id = ?`,
      [updatedUsername, updatedName, updatedRole, user.id]
    );

    if (!updateResult.affectedRows) {
      return res.status(500).json({ message: "อัปเดตข้อมูลไม่สำเร็จ" });
    }

    const token = updatedUsername !== user.username
      ? jwt.sign({ username: updatedUsername }, JWT_SECRET, { expiresIn: "12h" })
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

    if (![username, current_password, new_password, confirm_password].every(Boolean)) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    if (new_password !== confirm_password) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ไม่ตรงกัน" });
    }

    if (new_password.length < 8) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" });
    }

    const userResult = await query(
      "SELECT id, password FROM user WHERE username = ? LIMIT 1",
      [username]
    );
    const user = userResult.length ? userResult[0] : null;
    if (!user) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
    }

    const isMatch = await bcrypt.compare(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
    }

    const isSamePassword = await bcrypt.compare(new_password, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านเดิม" });
    }

    const hashedNew = await bcrypt.hash(new_password, 10);
    const updateResult = await query(
      "UPDATE user SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedNew, user.id]
    );

    if (!updateResult.affectedRows) {
      return res.status(500).json({ message: "เปลี่ยนรหัสผ่านไม่สำเร็จ" });
    }

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
