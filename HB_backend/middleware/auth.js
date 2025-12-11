const jwt = require("jsonwebtoken");
const pool = require("../mysql.js");
const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

exports.authAndRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.header("token");
      if (!token)
        return res.status(401).json({ message: "กรุณาแนบ token มากับ header" });

      // ตรวจสอบ token
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(401).json({
          message:
            err.name === "TokenExpiredError"
              ? "Token หมดอายุแล้ว"
              : "Token ไม่ถูกต้อง",
        });
      }

      // 🔥 ใช้ mysql2/promise แบบถูกต้อง
      const sql = `
        SELECT u.id, u.username, u.name, u.verify, u.role, r.role_name, u.assign
        FROM user u
        LEFT JOIN role r ON u.role = r.id
        WHERE u.username = ?
        LIMIT 1
      `;
      const [result] = await pool.query(sql, [decoded.username]);

      if (!result.length) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
      }

      const user = result[0];
      req.user = user;

      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ message: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้" });
      }

      next();
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
    }
  };
};

// exports.auth = async (req, res, next) => {
//   try {
//     const token = req.header("token");
//     if (!token)
//       return res.status(401).json({ message: "กรุณาแนบ token มากับ header" });

//     let decoded;
//     try {
//       decoded = jwt.verify(token, JWT_SECRET);
//     } catch (err) {
//       const msg =
//         err.name === "TokenExpiredError"
//           ? "Token หมดอายุแล้ว"
//           : "Token ไม่ถูกต้อง";
//       return res.status(401).json({ message: msg });
//     }

//     const sql = `
//       SELECT u.id, u.username, u.name, u.verify, u.role, r.role_name
//       FROM user u
//       LEFT JOIN role r ON u.role = r.id
//       WHERE u.username = ?
//       LIMIT 1
//     `;

//     db.query(
//       sql,
//       [decoded.username],
//       (err, results) => {
//         if (err) return res.status(500).json({ message: err.message });
//         if (results.length === 0) {
//           return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
//         }

//         const user = results[0];
//         // Optional: remove password before attaching
//         delete user.password;

//         req.user = user;
//         next();
//       }
//     );
//   } catch (error) {
//     return res.status(500).json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
//   }
// };

// // middleware/role.js
// exports.allowRoles = (...allowedRoles) => (req, res, next) => {
//   if (!req.user) return res.status(401).json({ message: "Unauthorized" });

//   // req.user.role is from your JOINed query
//   if (!allowedRoles.includes(req.user.role)) {
//     return res.status(403).json({ message: "คุณไม่มีสิทธิ์ทำรายการนี้" });
//   }

//   next();
// };

// ไว้จัดการสิทธิ์ที่มากขึ้นแบบไม่ hard code
// middleware/checkPermission.js
// const db = require("../mysql");

// exports.checkPermission = (featureName) => async (req, res, next) => {
//   const roleId = req.user.role;

//   const sql = `
//     SELECT f.name FROM role_feature rf
//     JOIN feature f ON rf.feature_id = f.id
//     WHERE rf.role_id = ? AND f.name = ?
//   `;
//   db.query(sql, [roleId, featureName], (err, results) => {
//     if (err) return res.status(500).json({ message: err.message });
//     if (results.length === 0)
//       return res.status(403).json({ message: "คุณไม่มีสิทธิ์ในส่วนนี้" });
//     next();
//   });
// };
