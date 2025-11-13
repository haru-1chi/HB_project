const db = require('../mysql.js'); // ⬅️ Import MySQL connection
const util = require("util");

const query = util.promisify(db.query).bind(db);

exports.createKPINameMed = async (req, res) => {
    const dataArray = Array.isArray(req.body) ? req.body : [req.body];
    const userName = req.user?.name || "Unknown User";

    try {
        if (dataArray.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "Data must be a non-empty array" });
        }

        const values = [];
        let reusedCount = 0;
        let insertedCount = 0;

        for (const item of dataArray) {
            const { mainKPI, subKPIs = [] } = item;
            const [existing] = await query(
                `SELECT id FROM kpi_name_med WHERE kpi_name = ? AND parent_id IS NULL LIMIT 1`,
                [mainKPI]
            );

            let mainId;

            if (existing) {
                mainId = existing.id;
                reusedCount++;
            } else {
                const mainResult = await query(
                    `INSERT INTO kpi_name_med (kpi_name, parent_id, created_by)
           VALUES (?, NULL, ?)`,
                    [mainKPI, userName]
                );
                mainId = mainResult.insertId;
                insertedCount++;
            }

            for (const sub of subKPIs) {
                const [subExists] = await query(
                    `SELECT id FROM kpi_name_med WHERE kpi_name = ? AND parent_id = ? LIMIT 1`,
                    [sub, mainId]
                );

                if (!subExists) {
                    values.push([sub, mainId, userName]);
                }
            }
        }

        if (values.length > 0) {
            await query(
                `INSERT INTO kpi_name_med (kpi_name, parent_id, created_by) VALUES ?`,
                [values]
            );
        }

        res.json({
            success: true,
            message: `✅ Main KPI(s): ${insertedCount} inserted, ${reusedCount} reused. Sub-KPI(s): ${values.length} inserted.`,
        });
    } catch (err) {
        console.error("❌ Error inserting KPI:", err);
        res.status(500).json({
            success: false,
            message: "Failed to insert KPI",
            error: err.message,
        });
    }
};

exports.updateKPINameMed = async (req, res) => {
    const { id, mainKPI, subKPIs = [] } = req.body; // id = main KPI row id
    const userName = req.user?.name || "Unknown User";

    if (!id || !mainKPI) {
        return res.status(400).json({ success: false, message: "Missing main KPI or id" });
    }

    try {
        // 1️⃣ Update main KPI name
        await query(
            `UPDATE kpi_name_med SET kpi_name = ?, updated_by = NOW() WHERE id = ?`,
            [mainKPI, id]
        );

        // 2️⃣ Get existing subKPIs for this main KPI
        const existingSubs = await query(
            `SELECT kpi_name FROM kpi_name_med WHERE parent_id = ?`,
            [id]
        );

        const existingSubNames = existingSubs.map(sub => sub.kpi_name);

        // 3️⃣ Insert only new subKPIs if they don't exist
        const newSubs = subKPIs.filter(
            sub => sub.trim() !== "" && !existingSubNames.includes(sub)
        );

        if (newSubs.length > 0) {
            const values = newSubs.map(sub => [sub, id, userName]);
            await query(
                `INSERT INTO kpi_name_med (kpi_name, parent_id, created_by) VALUES ?`,
                [values]
            );
        }

        res.json({
            success: true,
            message: `บันทึกสำเร็จ`,
        });
    } catch (err) {
        console.error("❌ Error saving edited KPI:", err);
        res.status(500).json({
            success: false,
            message: "Failed to save edited KPI",
            error: err.message,
        });
    }
};

// controllers/kpiController.js
exports.deleteKPINameMed = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: "ID is required" });
    }

    try {
        // 1️⃣ Soft delete main KPI and its sub-KPIs
        const result = await query(
            `
      UPDATE kpi_name_med
      SET deleted_at = NOW()
      WHERE (id = ? OR parent_id = ?) AND deleted_at IS NULL
    `,
            [id, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Record not found or already deleted",
            });
        }

        res.json({
            success: true,
            message: `บันทึกสำเร็จ ✅ ลบรายการหลักและหัวข้อย่อยทั้งหมด (${result.affectedRows})`,
        });
    } catch (err) {
        console.error("❌ Error soft deleting KPI:", err);
        res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
        });
    }
};


exports.getKPIMedName = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === "true";

        const sql = `
      SELECT *
      FROM kpi_name_med
      ${includeDeleted ? "" : "WHERE deleted_at IS NULL"}
    `;

        const result = await query(sql);

        res.status(200).json(result || []);
    } catch (err) {
        console.error("❌ Error fetching KPI names:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch KPI names",
            error: err.message,
        });
    }
};

//--------------------------------------
exports.createKPIMedError = async (req, res) => {
    try {
        const dataArray = req.body;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Data must be a non-empty array",
            });
        }

        const createdBy = req.user?.name || "Unknown User";

        // ✅ Map input data into array-of-arrays for bulk insert
        const values = dataArray.map((item) => [
            item.kpi_id,
            item.opd_id,
            item.A || 0,
            item.B || 0,
            item.C || 0,
            item.D || 0,
            item.E || 0,
            item.F || 0,
            item.G || 0,
            item.H || 0,
            item.I || 0,
            item.report_date,
        ]);

        const sql = `
      INSERT INTO kpi_med_error 
      (
        kpi_id, opd_id, 
        A, B, C, D, E, F, G, H, I, 
        report_date
      ) 
      VALUES ?
    `;

        const result = await query(sql, [values]);

        res.status(201).json({
            success: true,
            message: `Inserted ${result.affectedRows} record(s) successfully.`,
            inserted: result.affectedRows,
        });
    } catch (err) {
        console.error("❌ Error inserting KPI medication error data:", err);
        res.status(500).json({
            success: false,
            message: "Failed to insert KPI medication error data",
            error: err.message,
        });
    }
};

exports.getKPIMedData = async (req, res) => {
    const { kpi_id,
        opd_id,
        search, sinceDate, endDate } = req.query;

    try {
        let sql = `
          SELECT 
            e.*, 
            n.kpi_name AS kpi_label, 
            d.opd_name
          FROM kpi_med_error e
          LEFT JOIN kpi_name_med n ON e.kpi_id = n.id
          LEFT JOIN opd_name d ON e.opd_id = d.id
          WHERE 1=1
        `;
        const params = [];

        // ✅ Filter by KPI ID
        if (kpi_id) {
            sql += ` AND e.kpi_id = ?`;
            params.push(kpi_id);
        }

        // ✅ Filter by Department
        if (opd_id) {
            sql += ` AND e.opd_id = ?`;
            params.push(opd_id);
        }

        // ✅ Search filter (text or MM/YYYY date)
        if (search) {
            let formattedSearch = search;

            // convert MM/YYYY → YYYY-MM
            const match = /^(\d{2})\/(\d{4})$/.exec(search);
            if (match) {
                const [_, mm, yyyy] = match;
                formattedSearch = `${yyyy}-${mm}`;
            }

            sql += `
                AND (
                  n.kpi_name LIKE ? OR
                  d.opd_name LIKE ? OR
                  e.report_date LIKE ?
                )
              `;
            params.push(`%${search}%`, `%${search}%`, `%${formattedSearch}%`);
        }


        // ✅ Date range filter
        if (sinceDate && endDate) {
            sql += ` AND DATE_FORMAT(e.report_date, '%Y-%m') BETWEEN DATE_FORMAT(?, '%Y-%m') AND DATE_FORMAT(?, '%Y-%m')`;
            params.push(sinceDate, endDate);
        } else if (sinceDate) {
            sql += ` AND DATE_FORMAT(e.report_date, '%Y-%m') >= DATE_FORMAT(?, '%Y-%m')`;
            params.push(sinceDate);
        } else if (endDate) {
            sql += ` AND DATE_FORMAT(e.report_date, '%Y-%m') <= DATE_FORMAT(?, '%Y-%m')`;
            params.push(endDate);
        }

        // ✅ Order by date
        sql += ` ORDER BY e.report_date ASC`;

        // Run query
        const results = await query(sql, params);
        res.status(200).json(Array.isArray(results) ? results : []);
    } catch (err) {
        console.error("❌ Error fetching KPI MED data:", err);
        res.status(500).json({ error: 'Error fetching KPI MED data', message: err.message });

    }
};