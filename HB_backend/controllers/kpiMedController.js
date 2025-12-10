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


// exports.getKPIMedName = async (req, res) => {
//     try {
//         const includeDeleted = req.query.includeDeleted === "true";

//         const sql = `
//       SELECT *
//       FROM kpi_name_med
//       ${includeDeleted ? "" : "WHERE deleted_at IS NULL"}
//     `;

//         const result = await query(sql);

//         res.status(200).json(result || []);
//     } catch (err) {
//         console.error("❌ Error fetching KPI names:", err);
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch KPI names",
//             error: err.message,
//         });
//     }
// };
exports.getKPIMedName = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === "true";

        const sql = `
      SELECT id, kpi_name, parent_id
      FROM kpi_name_med
      ${includeDeleted ? "" : "WHERE deleted_at IS NULL"}
    `;

        const rows = await query(sql);

        // No data → return empty list
        if (!rows || rows.length === 0) {
            return res.status(200).json([]);
        }

        // Single pass mapping
        const lookup = new Map();
        const roots = [];

        // Initialize lookup with node objects
        for (const row of rows) {
            lookup.set(row.id, { ...row, children: [] });
        }

        // Build the tree in one loop
        for (const row of rows) {
            const node = lookup.get(row.id);

            if (row.parent_id) {
                const parent = lookup.get(row.parent_id);
                if (parent) parent.children.push(node);
            } else {
                roots.push(node);
            }
        }

        return res.status(200).json(roots);

    } catch (err) {
        console.error("❌ Error fetching KPI names:", err);
        return res.status(500).json({
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

        // 🚨 Validate input early
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Data must be a non-empty array",
            });
        }

        const createdBy = req.user?.name || "Unknown User";

        // 🔥 1. Pre-allocate array for speed (better than .map)
        const values = new Array(dataArray.length);

        for (let i = 0; i < dataArray.length; i++) {
            const item = dataArray[i];

            values[i] = [
                item.kpi_id,
                item.opd_id,
                item.A ?? 0,
                item.B ?? 0,
                item.C ?? 0,
                item.D ?? 0,
                item.E ?? 0,
                item.F ?? 0,
                item.G ?? 0,
                item.H ?? 0,
                item.I ?? 0,
                item.report_date,
                createdBy,   // added
            ];
        }

        // 🔥 2. Move column list & placeholders OUT of template literal formatting
        const sql = `
      INSERT INTO kpi_med_error (
        kpi_id, opd_id,
        A, B, C, D, E, F, G, H, I,
        report_date,
        created_by
      ) VALUES ?
    `;

        const result = await query(sql, [values]);

        return res.status(201).json({
            success: true,
            message: `Inserted ${result.affectedRows} record(s) successfully.`,
            inserted: result.affectedRows,
        });

    } catch (err) {
        console.error("❌ Error inserting KPI medication error data:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to insert KPI medication error data",
            error: err.message,
        });
    }
};

exports.updateKPIMedError = async (req, res) => {
    try {
        const data = req.body;

        if (!data.id) {
            return res.status(400).json({
                success: false,
                message: "Missing record ID to update.",
            });
        }

        const updatedBy = req.user?.name || "Unknown User";

        const allowedFields = [
            "kpi_id",
            "opd_id",
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
        ];
        const setParts = [];
        const params = [];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                setParts.push(`${field} = ?`);
                params.push(data[field]);
            }
        }

        // If no fields to update (unlikely but possible)
        if (setParts.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update.",
            });
        }

        // Add metadata
        setParts.push("updated_by = ?");
        params.push(updatedBy);

        setParts.push("updated_at = NOW()");

        // Add WHERE id = ?
        params.push(data.id);

        const sql = `
      UPDATE kpi_med_error
      SET ${setParts.join(", ")}
      WHERE id = ?
    `;

        const result = await query(sql, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Record not found or no changes made.",
            });
        }

        res.json({
            success: true,
            message: "KPI medication error data updated successfully.",
            updatedRows: result.affectedRows,
        });

    } catch (err) {
        console.error("❌ Error updating KPI medication error data:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update KPI medication error data.",
            error: err.message,
        });
    }
};

exports.deleteKPIMedError = async (req, res) => {
    try {
        const idParam = req.params.id;
        const bodyIds = req.body?.ids;

        // 🔥 1. Merge both sources of input
        const rawIds = [];

        if (idParam) rawIds.push(idParam);
        if (Array.isArray(bodyIds)) rawIds.push(...bodyIds);

        // 🚨 Validate final ID list
        if (rawIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one ID is required",
            });
        }

        // 🔥 2. Convert & filter IDs (FAST, no double mapping)
        const safeIds = [];
        const seen = new Set();

        for (const id of rawIds) {
            const num = Number(id);
            if (Number.isInteger(num) && num > 0 && !seen.has(num)) {
                seen.add(num);
                safeIds.push(num);
            }
        }

        if (safeIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format",
            });
        }

        // 🔥 3. Use static placeholder strategy (no dynamic string concat)
        const placeholders = new Array(safeIds.length).fill("?").join(",");

        const sql = `
      DELETE FROM kpi_med_error
      WHERE id IN (${placeholders})
    `;

        const result = await query(sql, safeIds);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "No data found for provided IDs",
            });
        }

        res.json({
            success: true,
            message: `Deleted ${result.affectedRows} record(s) successfully`,
            deletedCount: result.affectedRows,
        });

    } catch (err) {
        console.error("❌ Delete error:", err);
        res.status(500).json({
            success: false,
            message: "Database error",
            error: err.message,
        });
    }
};

exports.getKPIMedData = async (req, res) => {
    try {
        const month = req.query.month?.trim(); // expected format: "YYYY-MM"
        const sql = `
      SELECT 
        e.*, 
        n.kpi_name AS kpi_label, 
        n.parent_id,
        p.kpi_name AS kpi_parent_label,
        d.opd_name
      FROM kpi_med_error e
      LEFT JOIN kpi_name_med n ON e.kpi_id = n.id
      LEFT JOIN kpi_name_med p ON n.parent_id = p.id
      LEFT JOIN opd_name d ON e.opd_id = d.id
      WHERE 1=1
        ${month ? "AND e.report_date >= ? AND e.report_date < ?" : ""}
      ORDER BY e.report_date ASC
    `;

        const params = [];

        if (month) {
            // ✅ Calculate start and end of the month
            const startDate = `${month}`;
            const [year, mon] = month.split("-");
            const nextMonth = (Number(mon) === 12)
                ? `${Number(year) + 1}-01-01`
                : `${year}-${String(Number(mon) + 1).padStart(2, "0")}-01`;

            params.push(startDate, nextMonth);
        }

        const results = await query(sql, params);
        res.status(200).json(results || []);

    } catch (err) {
        console.error("❌ Error fetching KPI MED data:", err);
        res.status(500).json({
            error: "Error fetching KPI MED data",
            message: err.message,
        });
    }
};


// exports.getKPIMedPie = async (req, res) => {
//     try {
//         const { sinceDate, endDate, kpi_id, opd_id, type } = req.query;

//         const kpiId = Number(kpi_id);
//         if (!kpiId) {
//             return res.status(400).json({ error: "Missing or invalid KPI ID" });
//         }

//         const mode = (type || "detail").trim();

//         /**
//          * 1️⃣ Fetch all related KPIs (recursive CTE)
//          *    Return early if none found – avoids useless queries.
//          */
//         const kpiRows = await query(
//             `
//             WITH RECURSIVE kpi_tree AS (
//                 SELECT id, parent_id
//                 FROM kpi_name_med
//                 WHERE id = ?

//                 UNION ALL

//                 SELECT k.id, k.parent_id
//                 FROM kpi_name_med k
//                 JOIN kpi_tree t ON k.parent_id = t.id
//                 WHERE k.deleted_at IS NULL
//             )
//             SELECT id FROM kpi_tree;
//             `,
//             [kpiId]
//         );

//         if (!kpiRows.length) {
//             return res.status(200).json({});
//         }

//         const targetKpiIds = kpiRows.map(r => r.id);

//         /**
//          * 2️⃣ Build WHERE clause efficiently (no repeated .map(), no string churn)
//          */
//         const whereParts = [`kpi_id IN (${Array(targetKpiIds.length).fill('?').join(',')})`];
//         const params = [...targetKpiIds];

//         if (sinceDate) {
//             whereParts.push(`report_date >= DATE_FORMAT(?, '%Y-%m-01')`);
//             params.push(sinceDate);
//         }

//         if (endDate) {
//             whereParts.push(`report_date <= LAST_DAY(DATE_FORMAT(?, '%Y-%m-01'))`);
//             params.push(endDate);
//         }

//         if (opd_id) {
//             whereParts.push(`opd_id = ?`);
//             params.push(opd_id);
//         }

//         const whereSQL = `WHERE ${whereParts.join(' AND ')}`;

//         /**
//          * 3️⃣ Precompute SELECT field template
//          *    Keeps SQL engine work minimal.
//          */
//         const SELECT_FIELDS =
//             mode === "group"
//                 ? `
//                     SUM(A + B) AS AB,
//                     SUM(C + D) AS CD,
//                     SUM(E + F) AS EF,
//                     SUM(G + H + I) AS GHI
//                   `
//                 : `
//                     SUM(A) AS A, SUM(B) AS B, SUM(C) AS C,
//                     SUM(D) AS D, SUM(E) AS E, SUM(F) AS F,
//                     SUM(G) AS G, SUM(H) AS H, SUM(I) AS I
//                   `;

//         const sql = `
//             SELECT ${SELECT_FIELDS}
//             FROM kpi_med_error
//             ${whereSQL};
//         `;

//         /**
//          * 4️⃣ Execute query (single row aggregated)
//          */
//         const [row] = await query(sql, params);

//         /**
//          * 5️⃣ Prepare lightweight response
//          */
//         if (mode === "group") {
//             return res.status(200).json({
//                 AB: row?.AB ?? 0,
//                 CD: row?.CD ?? 0,
//                 EF: row?.EF ?? 0,
//                 GHI: row?.GHI ?? 0,
//             });
//         }

//         const fields = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
//         const mapped = {};

//         for (const key of fields) {
//             mapped[key] = row?.[key] ?? 0;
//         }

//         return res.status(200).json(mapped);

//     } catch (err) {
//         console.error("❌ Error fetching KPI pie:", err);
//         return res.status(500).json({
//             error: "Error fetching KPI pie",
//             message: err.message,
//         });
//     }
// };

exports.getKPIMedPie = async (req, res) => {
    try {
        const { sinceDate, endDate, opd_id, work_id, mission_id, type } = req.query;
        const mode = (type || "detail").trim();

        const detailFields = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];

        // ===============================
        // 1️⃣ Determine OPDs to filter
        // ===============================
        let opdList = [];

        // 1) opd_id → ใช้เลย
        if (opd_id) {
            opdList = [opd_id];
        }

        // 2) work_id → โหลด opd ทั้งหมดของ work นั้น
        else if (work_id) {
            const rows = await query(
                `SELECT id FROM opd_name WHERE work_id = ? AND deleted_at IS NULL`,
                [work_id]
            );
            opdList = rows.map(r => r.id);
        }

        // 3) mission_id → โหลด opd ทั้งหมดของ mission นั้น
        else if (mission_id) {
            const rows = await query(`
        SELECT o.id
        FROM opd_name o
        JOIN work_name w ON o.work_id = w.id
        WHERE w.mission_id = ? AND o.deleted_at IS NULL
    `, [mission_id]);
            opdList = rows.map(r => r.id);
        }

        // 4) ถ้าไม่เลือกอะไรเลย (all) → โหลด ALL opd
        else {
            const rows = await query(
                `SELECT id FROM opd_name WHERE deleted_at IS NULL`
            );
            opdList = rows.map(r => r.id);
        }
        if ((work_id || mission_id) && opdList.length === 0) {
            return res.json([]);
        }

        // Format WHERE conditions only once
        const conditions = [];
        const params = [];

        if (sinceDate) {
            conditions.push("report_date >= ?");
            params.push(sinceDate);
        }
        if (endDate) {
            conditions.push("report_date <= ?");
            params.push(endDate);
        }
        if (opdList.length > 0) {
            conditions.push(`opd_id IN (${opdList.map(() => '?').join(',')})`);
            params.push(...opdList);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        // 1️⃣ Load all KPI names (parent + child)
        const allKpis = await query(`
      SELECT id, kpi_name, parent_id
      FROM kpi_name_med
      WHERE deleted_at IS NULL
    `);

        if (!allKpis.length) return res.json([]);

        // 2️⃣ Load all KPI SUM values (single query)
        const sumSql = `
      SELECT 
        kpi_id,
        ${detailFields.map(f => `SUM(${f}) AS ${f}`).join(", ")}
      FROM kpi_med_error
      ${whereClause}
      GROUP BY kpi_id
    `;

        const sumData = await query(sumSql, params);

        // Convert into a lookup table
        const sumLookup = new Map();
        for (const row of sumData) {
            sumLookup.set(row.kpi_id, row);
        }

        // 3️⃣ Turn raw SUM rows into mapped values (group or detail)
        const mapFields = (row) => {
            if (!row) return {};

            if (mode === "detail") {
                const result = {};
                for (const f of detailFields) result[f] = row[f] ?? 0;
                return result;
            }

            return {
                AB: (row.A ?? 0) + (row.B ?? 0),
                CD: (row.C ?? 0) + (row.D ?? 0),
                EF: (row.E ?? 0) + (row.F ?? 0),
                GHI: (row.G ?? 0) + (row.H ?? 0) + (row.I ?? 0),
            };
        };

        // 4️⃣ Build lookup for all KPI nodes
        const lookup = new Map();
        for (const kpi of allKpis) {
            lookup.set(kpi.id, {
                ...kpi,
                data: mapFields(sumLookup.get(kpi.id)),
                children: [],
            });
        }

        // 5️⃣ Build tree in memory
        const parents = [];
        for (const kpi of lookup.values()) {
            if (kpi.parent_id) {
                const parent = lookup.get(kpi.parent_id);
                if (parent) parent.children.push(kpi);
            } else {
                parents.push(kpi);
            }
        }

        // 6️⃣ Aggregate children values upward
        const addChildSum = (parent) => {
            for (const child of parent.children) {
                addChildSum(child);

                for (const key in child.data) {
                    parent.data[key] = (parent.data[key] ?? 0) + (child.data[key] ?? 0);
                }
            }
        };

        for (const p of parents) addChildSum(p);

        // 7️⃣ Filter out parents that have all 0 values (including children)
        const filtered = parents.filter((p) => {
            return Object.values(p.data).some(v => v !== 0);
        });

        return res.json(filtered);

    } catch (err) {
        console.error("❌ Error fetching KPI pie:", err);
        return res.status(500).json({
            error: "Error fetching KPI pie",
            message: err.message,
        });
    }
};


exports.getKPIMedStack = async (req, res) => {
    try {
        const { sinceDate, endDate, kpi_id, opd_id, work_id, mission_id, type } = req.query;
        const kpiId = Number(kpi_id);
        const mode = (type || "detail").trim();

        if (!kpiId) {
            return res.status(400).json({ error: "Missing or invalid KPI ID" });
        }

        // ================================================================
        // 1️⃣ Determine OPDs to filter (SAME LOGIC AS getKPIMedPie)
        // ================================================================
        let opdList = [];

        if (opd_id) {
            opdList = [opd_id];
        }
        else if (work_id) {
            const rows = await query(
                `SELECT id FROM opd_name WHERE work_id = ? AND deleted_at IS NULL`,
                [work_id]
            );
            opdList = rows.map(r => r.id);
        }
        else if (mission_id) {
            const rows = await query(`
                SELECT o.id
                FROM opd_name o
                JOIN work_name w ON o.work_id = w.id
                WHERE w.mission_id = ? AND o.deleted_at IS NULL
            `, [mission_id]);
            opdList = rows.map(r => r.id);
        }
        else {
            const rows = await query(
                `SELECT id FROM opd_name WHERE deleted_at IS NULL`
            );
            opdList = rows.map(r => r.id);
        }

        if ((work_id || mission_id) && opdList.length === 0) {
            return res.json([]); // ไม่มี OPD ให้ query เลย → return empty
        }

        // ================================================================
        // 2️⃣ Fetch recursive KPI tree (unchanged logic)
        // ================================================================
        const kpiRows = await query(
            `
            WITH RECURSIVE kpi_tree AS (
                SELECT id, parent_id
                FROM kpi_name_med
                WHERE id = ?

                UNION ALL

                SELECT k.id, k.parent_id
                FROM kpi_name_med k
                JOIN kpi_tree t 
                  ON k.parent_id = t.id
                WHERE k.deleted_at IS NULL
            )
            SELECT id FROM kpi_tree;
            `,
            [kpiId]
        );

        const targetKpiIds = kpiRows.map(r => r.id);
        if (targetKpiIds.length === 0) {
            return res.status(200).json([]);
        }

        // ================================================================
        // 3️⃣ Build WHERE conditions
        // ================================================================
        const params = [];
        const whereParts = [];

        // KPI list
        whereParts.push(`kpi_id IN (${targetKpiIds.map(() => '?').join(',')})`);
        params.push(...targetKpiIds);

        // Date filters
        if (sinceDate) {
            whereParts.push(`report_date >= DATE_FORMAT(?, '%Y-%m-01')`);
            params.push(sinceDate);
        }

        if (endDate) {
            whereParts.push(`report_date <= LAST_DAY(DATE_FORMAT(?, '%Y-%m-01'))`);
            params.push(endDate);
        }

        // OPD filter (NEW FEATURE)
        if (opdList.length > 0) {
            whereParts.push(`opd_id IN (${opdList.map(() => '?').join(',')})`);
            params.push(...opdList);
        }

        const whereSQL = `WHERE ${whereParts.join(" AND ")}`;

        // ================================================================
        // 4️⃣ Build SELECT fields
        // ================================================================
        const SELECT_FIELDS =
            mode === "group"
                ? `
                    SUM(A + B) AS AB,
                    SUM(C + D) AS CD,
                    SUM(E + F) AS EF,
                    SUM(G + H + I) AS GHI
                  `
                : `
                    SUM(A) AS A, SUM(B) AS B, SUM(C) AS C,
                    SUM(D) AS D, SUM(E) AS E, SUM(F) AS F,
                    SUM(G) AS G, SUM(H) AS H, SUM(I) AS I
                  `;

        // ================================================================
        // 5️⃣ Query SQL
        // ================================================================
        const queryStr = `
            SELECT
                ${SELECT_FIELDS},
                DATE_FORMAT(report_date, '%Y-%m') AS month_key,
                DATE_FORMAT(report_date, '%b-%y') AS month_display
            FROM kpi_med_error
            ${whereSQL}
            GROUP BY month_key
            ORDER BY month_key;
        `;

        const rows = await query(queryStr, params);

        if (rows.length === 0) {
            return res.status(200).json([]);
        }

        // ================================================================
        // 6️⃣ Format Output
        // ================================================================
        const response = rows.map(r =>
            mode === "group"
                ? {
                    month: r.month_display,
                    month_key: r.month_key,
                    AB: r.AB || 0,
                    CD: r.CD || 0,
                    EF: r.EF || 0,
                    GHI: r.GHI || 0
                }
                : {
                    month: r.month_display,
                    month_key: r.month_key,
                    A: r.A || 0, B: r.B || 0,
                    C: r.C || 0, D: r.D || 0,
                    E: r.E || 0, F: r.F || 0,
                    G: r.G || 0, H: r.H || 0, I: r.I || 0
                }
        );

        return res.status(200).json(response);

    } catch (err) {
        console.error("❌ Error fetching KPI stacked chart:", err);
        return res.status(500).json({
            error: "Error fetching KPI stacked chart",
            message: err.message
        });
    }
};



// exports.getKPIMedData = async (req, res) => {
//     const { kpi_id,
//         opd_id,
//         search, sinceDate, endDate } = req.query;

//     try {
//         let sql = `
//           SELECT
//             e.*,
//             n.kpi_name AS kpi_label,
//             d.opd_name
//           FROM kpi_med_error e
//           LEFT JOIN kpi_name_med n ON e.kpi_id = n.id
//           LEFT JOIN opd_name d ON e.opd_id = d.id
//           WHERE 1=1
//         `;
//         const params = [];

//         // ✅ Filter by KPI ID
//         if (kpi_id) {
//             sql += ` AND e.kpi_id = ?`;
//             params.push(kpi_id);
//         }

//         // ✅ Filter by Department
//         if (opd_id) {
//             sql += ` AND e.opd_id = ?`;
//             params.push(opd_id);
//         }

//         // ✅ Search filter (text or MM/YYYY date)
//         if (search) {
//             let formattedSearch = search;

//             // convert MM/YYYY → YYYY-MM
//             const match = /^(\d{2})\/(\d{4})$/.exec(search);
//             if (match) {
//                 const [_, mm, yyyy] = match;
//                 formattedSearch = `${yyyy}-${mm}`;
//             }

//             sql += `
//                 AND (
//                   n.kpi_name LIKE ? OR
//                   d.opd_name LIKE ? OR
//                   e.report_date LIKE ?
//                 )
//               `;
//             params.push(`%${search}%`, `%${search}%`, `%${formattedSearch}%`);
//         }


//         // ✅ Date range filter
//         if (sinceDate && endDate) {
//             sql += ` AND DATE_FORMAT(e.report_date, '%Y-%m') BETWEEN DATE_FORMAT(?, '%Y-%m') AND DATE_FORMAT(?, '%Y-%m')`;
//             params.push(sinceDate, endDate);
//         } else if (sinceDate) {
//             sql += ` AND DATE_FORMAT(e.report_date, '%Y-%m') >= DATE_FORMAT(?, '%Y-%m')`;
//             params.push(sinceDate);
//         } else if (endDate) {
//             sql += ` AND DATE_FORMAT(e.report_date, '%Y-%m') <= DATE_FORMAT(?, '%Y-%m')`;
//             params.push(endDate);
//         }

//         // ✅ Order by date
//         sql += ` ORDER BY e.report_date ASC`;

//         // Run query
//         const results = await query(sql, params);
//         res.status(200).json(Array.isArray(results) ? results : []);
//     } catch (err) {
//         console.error("❌ Error fetching KPI MED data:", err);
//         res.status(500).json({ error: 'Error fetching KPI MED data', message: err.message });

//     }
// };