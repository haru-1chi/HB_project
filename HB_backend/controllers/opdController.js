const db = require('../mysql.js'); // ⬅️ Import MySQL connection
const util = require("util");

const query = util.promisify(db.query).bind(db);
const queryAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
    });

exports.createOPDName = async (req, res) => {
    const dataArray = req.body;
    const userName = req.user?.name || "Unknown User";

    try {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({ success: false, message: "Data must be a non-empty array" });
        }

        const values = dataArray.map((item) => [
            item.opd_name,
            userName,
        ]);

        const sql = `
      INSERT INTO opd_name
      (opd_name, created_by) 
      VALUES ?
    `;

        const result = await queryAsync(sql, [values]);

        res.json({
            success: true,
            message: `✅ Inserted ${result.affectedRows} record(s) successfully`,
        });
    } catch (err) {
        console.error("❌ Error inserting KPI names:", err);
        res.status(500).json({
            success: false,
            message: "Failed to insert data",
            error: err.message,
        });
    }
};

exports.updateOPDName = async (req, res) => {
    const dataArray = req.body;
    const userName = req.user?.name || "Unknown User";

    try {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({ success: false, message: "Data must be a non-empty array" });
        }

        // Prepare fields for CASE WHEN update
        const fields = ["opd_name"];
        const cases = {};
        fields.forEach(f => (cases[f] = []));

        const ids = [];

        dataArray.forEach(item => {
            ids.push(item.id);
            fields.forEach(f => {
                const value = item[f] ?? null;
                // Use db.escape to prevent SQL injection
                cases[f].push(`WHEN ${item.id} THEN ${db.escape(value)}`);
            });
        });

        // Construct single bulk UPDATE query
        const sql = `
      UPDATE opd_name
      SET
        ${fields.map(f => `${f} = CASE id ${cases[f].join(" ")} END`).join(", ")},
        updated_by = ${db.escape(userName)},
        updated_at = NOW()
      WHERE id IN (${ids.join(",")})
    `;

        // Execute query
        await new Promise((resolve, reject) => {
            db.query(sql, (err, result) => (err ? reject(err) : resolve(result)));
        });

        res.json({ success: true, message: `✅ Updated ${dataArray.length} record(s) successfully` });
    } catch (err) {
        console.error("❌ Error updating KPI names:", err);
        res.status(500).json({ success: false, message: "Failed to update data", error: err.message });
    }
};

exports.deleteOPDName = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: "ID is required" });
    }

    try {
        const sql = `
      UPDATE opd_name
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

        // Wrap db.query in a promise for async/await
        const result = await new Promise((resolve, reject) => {
            db.query(sql, [id], (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Record not found or already deleted",
            });
        }

        res.json({
            success: true,
            message: "Record soft deleted successfully",
            affectedRows: result.affectedRows,
        });
    } catch (err) {
        console.error("❌ Error soft deleting KPI name:", err);
        res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
        });
    }
};

exports.getOPDName = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === "true";

        const query = `
    SELECT 
      id,
      CASE 
        WHEN deleted_at IS NOT NULL THEN CONCAT(opd_name, ' (ข้อมูลไม่ใช้แล้ว)')
        ELSE opd_name
      END AS opd_name,
      deleted_at
    FROM opd_name
    ${includeDeleted ? "" : "WHERE deleted_at IS NULL"}
    order by deleted_at asc
  `;

        const result = await new Promise((resolve, reject) => {
            db.query(query, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.status(200).json(Array.isArray(result) ? result : []);
    } catch (err) {
        console.error("❌ Error fetching KPI names:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch KPI names",
            error: err.message,
        });
    }
};