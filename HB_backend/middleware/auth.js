const jwt = require("jsonwebtoken");
const db = require("../mysql.js");

const JWT_SECRET = process.env.JWT_SECRET || "secret_key";

exports.auth = async (req, res, next) => {
  try {
    const token = req.header("token");
    if (!token)
      return res.status(401).json({ message: "กรุณาแนบ token มากับ header" });

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      const msg =
        err.name === "TokenExpiredError"
          ? "Token หมดอายุแล้ว"
          : "Token ไม่ถูกต้อง";
      return res.status(401).json({ message: msg });
    }

    db.query(
      "SELECT * FROM user WHERE username = ?",
      [decoded.username],
      (err, results) => {
        if (err) return res.status(500).json({ message: err.message });
        if (results.length === 0) {
          return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
        }

        const user = results[0];
        // Optional: remove password before attaching
        delete user.password;

        req.user = user;
        next();
      }
    );
  } catch (error) {
    return res.status(500).json({ message: "มีบางอย่างผิดพลาด โปรดลองอีกครั้ง" });
  }
};
