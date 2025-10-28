const db = require('../mysql.js'); // ⬅️ Import MySQL connection

const queryAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
    });

const monthTH = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
    "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
    "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const monthEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

exports.checkDuplicates = async (req, res) => {
    try {
        const dataArray = req.body;
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({ message: "Data must be a non-empty array" });
        }

        // Build query dynamically
        const conditions = dataArray
            .map(() => "(d.kpi_name = ? AND d.type = ? AND DATE_FORMAT(d.report_date, '%Y-%m') = ?)")
            .join(" OR ");
        const values = dataArray.flatMap(item => [
            item.kpi_name,
            item.type,
            item.report_date?.slice(0, 7) || null
        ]);

        const sql = `
      SELECT 
        d.id,
        d.kpi_name AS kpi_id,
        n.kpi_name AS kpi_label,
        d.a_value,
        d.b_value,
        d.type,
        d.report_date
      FROM kpi_data d
      LEFT JOIN kpi_name n ON d.kpi_name = n.id
      WHERE ${conditions}
    `;

        db.query(sql, values, (err, existingRecords) => {
            if (err) {
                console.error("Database error in checkDuplicates:", err);
                return res.status(500).json({ message: "Database query failed" });
            }

            // Optimize lookup with Map
            const existingMap = new Map(
                existingRecords.map(e => [
                    `${e.kpi_id}-${e.type}-${String(e.report_date).slice(0, 7)}`,
                    e
                ])
            );
            let idCounter = 1;
            const pairs = [];
            for (const newItem of dataArray) {
                const key = `${newItem.kpi_name}-${newItem.type}-${String(newItem.report_date).slice(0, 7)}`;
                const oldItem = existingMap.get(key);


                if (oldItem) {
                    pairs.push(
                        {
                            id: idCounter++,
                            status: "เดิม",
                            kpi_label: oldItem.kpi_label,
                            kpi_name: oldItem.kpi_id,
                            a_value: oldItem.a_value,
                            b_value: oldItem.b_value,
                            type: oldItem.type,
                            report_date: oldItem.report_date
                        },
                        {
                            id: idCounter++,
                            status: "ใหม่",
                            kpi_label: oldItem.kpi_label,
                            kpi_name: oldItem.kpi_id,
                            a_value: newItem.a_value,
                            b_value: newItem.b_value,
                            type: newItem.type,
                            report_date: newItem.report_date
                        }
                    );
                }
            }

            res.json({
                pairs,
                totalChecked: dataArray.length
            });
        });
    } catch (error) {
        console.error("Error in checkDuplicates:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.createOrUpdate = async (req, res) => {
    const { data, mode } = req.body;
    const userName = req.user?.name || "Unknown User";

    if (!Array.isArray(data) || data.length === 0)
        return res.status(400).json({ message: "Data must be a non-empty array" });
    if (!["overwrite", "skip"].includes(mode))
        return res.status(400).json({ message: "Invalid mode" });

    try {
        const normalizeKey = (item) => `${item.kpi_name}_${item.type}_${item.report_date.slice(0, 7)}`;

        const normalizedData = data.map(item => ({
            ...item,
            reportMonth: item.report_date.slice(0, 7),
            key: normalizeKey(item)
        }));

        const placeholders = normalizedData.map(() => "(kpi_name = ? AND type = ? AND DATE_FORMAT(report_date, '%Y-%m') = ?)").join(" OR ");
        const values = normalizedData.flatMap(item => [item.kpi_name, item.type, item.reportMonth]);
        const existing = await new Promise((resolve, reject) => {
            db.query(
                `SELECT kpi_name, type, DATE_FORMAT(report_date, '%Y-%m') AS report_month FROM kpi_data WHERE ${placeholders}`,
                values,
                (err, result) => err ? reject(err) : resolve(result)
            );
        });

        const existingMap = new Map(existing.map(e => [`${e.kpi_name}_${e.type}_${e.report_month}`, true]));

        if (mode === "overwrite") {
            const tasks = normalizedData.map(item => {
                return new Promise((resolve, reject) => {
                    const key = item.key;
                    if (existingMap.has(key)) {
                        const sql = `
              UPDATE kpi_data 
              SET a_value = ?, b_value = ?, updated_by = ?, updated_at = NOW()
              WHERE kpi_name = ? AND type = ? AND DATE_FORMAT(report_date, '%Y-%m') = ?
            `; //เหมือนไม่ได้ update report_date ด้วย
                        db.query(sql, [item.a_value, item.b_value, userName, item.kpi_name, item.type, item.reportMonth], (err, result) => err ? reject(err) : resolve({ type: "update", key }));
                    } else {
                        const sql = `
              INSERT INTO kpi_data 
              (kpi_name, a_value, b_value, type, report_date, created_by, updated_by, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `;
                        db.query(sql, [item.kpi_name, item.a_value, item.b_value, item.type, item.report_date, userName, userName], (err, result) => err ? reject(err) : resolve({ type: "insert", key }));
                    }
                });
            });
            const results = await Promise.allSettled(tasks);

            const inserted = results.filter(r => r.status === "fulfilled" && r.value.type === "insert").length;
            const updated = results.filter(r => r.status === "fulfilled" && r.value.type === "update").length;

            res.json({ message: "Operation complete", inserted, updated });
        } else if (mode === "skip") {
            // skip mode: only insert new
            const newData = normalizedData.filter(item => !existingMap.has(item.key));
            if (newData.length === 0) return res.json({ message: "No new records to insert" });

            const insertValues = newData.map(item => [item.kpi_name, item.a_value, item.b_value, item.type, item.report_date, userName, userName, new Date()]);
            const sql = `
        INSERT INTO kpi_data (kpi_name, a_value, b_value, type, report_date, created_by, updated_by, updated_at)
        VALUES ?
      `;
            db.query(sql, [insertValues], (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Failed to insert new records" });
                }
                res.json({ message: "Inserted new records", count: newData.length });
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal server error");
    }
};

exports.createdata = (req, res) => {
    const dataArray = req.body;
    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    const createdBy = req.user?.name || "Unknown User";

    const values = dataArray.map(item => [
        item.kpi_name,
        createdBy,
        item.a_value,
        item.b_value,
        item.type,
        item.report_date
    ]);

    const sql = `
      INSERT INTO kpi_data 
      (kpi_name, created_by, a_value, b_value, type, report_date) 
      VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
        if (err) {
            res.status(400).send(err);
        } else {
            res.send("Data inserted");
        }
    });
}; //ไม่ใช้แล้ว



exports.updateKPIData = async (req, res) => {
    const dataArray = req.body;
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or empty data array" });
    }

    const updatedBy = req.user?.name || "Unknown User";

    try {
        const dupCheckSQL = `
      SELECT id, kpi_name, type, report_date
      FROM kpi_data
      WHERE (${dataArray
                .map(
                    (_, i) =>
                        `(kpi_name = ? AND type = ? AND DATE_FORMAT(report_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m') AND id != ?)`
                )
                .join(" OR ")})
    `;

        const dupParams = dataArray.flatMap((d) => [d.kpi_name, d.type, d.report_date, d.id]);
        const duplicates = await queryAsync(dupCheckSQL, dupParams);

        if (duplicates.length > 0) {
            return res.status(409).json({
                success: false,
                message: "ข้อมูลซ้ำกับแถวอื่น",
                duplicate: true,
                duplicates,
            });
        }

        // ✅ 2. Start a transaction for safe batch update
        await queryAsync("START TRANSACTION");

        const ids = dataArray.map((item) => item.id);
        const fields = ["kpi_name", "a_value", "b_value", "type", "report_date"];
        const caseClauses = fields.map(
            (field) =>
                `${field} = CASE id ${dataArray
                    .map((item) => `WHEN ${db.escape(item.id)} THEN ${db.escape(item[field] ?? null)}`)
                    .join(" ")} END`
        );

        const updateSQL = `
      UPDATE kpi_data
      SET 
        ${caseClauses.join(", ")},
        updated_by = ${db.escape(updatedBy)},
        updated_at = NOW()
      WHERE id IN (${ids.join(",")})
    `;

        await queryAsync(updateSQL);
        await queryAsync("COMMIT");

        res.json({ success: true, message: "✅ Data updated successfully" });
    } catch (err) {
        console.error("❌ Error updating data:", err);
        await queryAsync("ROLLBACK");
        res.status(500).json({ success: false, message: "Failed to update data" });
    }
};

exports.deleteKPIData = async (req, res) => {
    try {
        let { id } = req.params;
        let { ids } = req.body;

        if (id) ids = [id];
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "At least one ID is required" });
        }

        const safeIds = [...new Set(ids.map((v) => parseInt(v, 10)).filter((v) => Number.isInteger(v) && v > 0))];
        if (safeIds.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        const sql = `DELETE FROM kpi_data WHERE id IN (${safeIds.map(() => "?").join(",")})`;

        await queryAsync("START TRANSACTION");
        const result = await queryAsync(sql, safeIds);

        if (result.affectedRows === 0) {
            await queryAsync("ROLLBACK");
            return res.status(404).json({ success: false, message: "No data found for provided IDs" });
        }

        await queryAsync("COMMIT");

        res.json({
            success: true,
            message: `✅ ${result.affectedRows} record(s) deleted successfully`,
            deletedCount: result.affectedRows,
        });
    } catch (err) {
        console.error("❌ Delete error:", err);
        try {
            await queryAsync("ROLLBACK");
        } catch (_) { }
        res.status(500).json({ success: false, message: "Database error" });
    }
};


exports.getKPIData = async (req, res) => {
    const { kpi_name, search } = req.query;
    try {
        let query = `
    SELECT d.*, n.kpi_name AS kpi_label, n.a_name, n.b_name
    FROM kpi_data d
    LEFT JOIN kpi_name n ON d.kpi_name = n.id
    WHERE 1=1
  `;
        const params = [];

        if (kpi_name) {
            query += ` AND d.kpi_name = ?`;
            params.push(kpi_name);
        }

        if (search) {
            query += ` AND (d.a_value LIKE ? OR d.b_value LIKE ? OR d.type LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY d.report_date ASC`;

        const data = await new Promise((resolve, reject) => {
            db.query(query, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        });

        // ✅ Always return an array
        res.status(200).json(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error("❌ Error fetching KPI data:", err);
        // ✅ Still return an array even if error
        res.status(500).json([]);
    }
};

//kpi name--------------------------------------------------------------------------
exports.createKPIName = async (req, res) => {
    const dataArray = req.body;
    const userName = req.user?.name || "Unknown User";

    try {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({ success: false, message: "Data must be a non-empty array" });
        }

        const values = dataArray.map((item) => [
            item.kpi_name,
            item.a_name ?? null,
            item.b_name ?? null,
            userName,
        ]);

        const sql = `
      INSERT INTO kpi_name
      (kpi_name, a_name, b_name, created_by) 
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

exports.updateKPIName = async (req, res) => {
    const dataArray = req.body;
    const userName = req.user?.name || "Unknown User";

    try {
        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({ success: false, message: "Data must be a non-empty array" });
        }

        // Prepare fields for CASE WHEN update
        const fields = ["kpi_name", "a_name", "b_name"];
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
      UPDATE kpi_name
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

exports.deleteKPIName = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: "ID is required" });
    }


    const sql = `
    UPDATE kpi_name 
    SET deleted_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;

    try {
        const sql = `
      UPDATE kpi_name
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

exports.getKPIName = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === "true";

        const query = `
    SELECT 
      id,
      CASE 
        WHEN deleted_at IS NOT NULL THEN CONCAT(kpi_name, ' (ข้อมูลไม่ใช้แล้ว)')
        ELSE kpi_name
      END AS kpi_name,
      a_name,
      b_name,
      deleted_at
    FROM kpi_name
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

//dashboard--------------------------------------------------------------------------
exports.getData = async (req, res) => {
    try {
        const kpi_name = req.query.kpi_name?.trim();
        const type = req.query.type?.trim() || "รวม";
        const chart = req.query.chart?.trim() || "percent";
        const since = req.query.since;
        const until = req.query.until;

        // Build WHERE clause dynamically
        const whereClause = [];
        const params = [];

        if (kpi_name) {
            whereClause.push("d.kpi_name = ?");
            params.push(kpi_name);
        }

        if (type != "รวม" && chart !== "percent") {
            whereClause.push("d.type = ?");
            params.push(type);
        }
        if (since && until) {
            whereClause.push("d.report_date BETWEEN ? AND ?");
            params.push(since, until);
        } else if (since) {
            whereClause.push("d.report_date >= ?");
            params.push(since);
        } else if (until) {
            whereClause.push("d.report_date <= ?");
            params.push(until);
        }

        let query;
        const whereSQL = whereClause.length ? "WHERE " + whereClause.join(" AND ") : "";

        if (chart === "percent") {
            if (type === "รวม") {
                // ✅ รวม case — summarized only
                query = `
          SELECT
            d.kpi_name,
            n.a_name,
            n.b_name,
            'รวม' AS type,
            ROUND(SUM(d.a_value) / SUM(d.b_value) * 100, 2) AS result,
            DATE_FORMAT(d.report_date, '%b-%y') AS month,
            DATE_FORMAT(d.report_date, '%Y-%m') AS month_key
          FROM kpi_data d
          LEFT JOIN kpi_name n ON d.kpi_name = n.id
          ${whereSQL}
          GROUP BY DATE_FORMAT(d.report_date, '%Y-%m')
          ORDER BY month_key;
        `;
            } else {
                query = `
          SELECT 
            d.kpi_name,
            n.a_name,
            n.b_name,
            d.type,
            ROUND((d.a_value / d.b_value) * 100, 2) AS result,
            DATE_FORMAT(d.report_date, '%b-%y') AS month,
            DATE_FORMAT(d.report_date, '%Y-%m') AS month_key
          FROM kpi_data d
          LEFT JOIN kpi_name n ON d.kpi_name = n.id
          ${whereClause.length ? "WHERE " + whereClause.join(" AND ") + " AND d.type = ?" : "WHERE d.type = ?"}
          ORDER BY month_key;
        `;
                params.push(type);
            }
        } else if (chart !== "percent" && type === "รวม") {
            query = `
        SELECT 
            d.kpi_name,
            n.a_name,
            n.b_name,
            'รวม' AS type,
            SUM(d.a_value) AS a_value,
            SUM(d.b_value) AS b_value,
            MAX(d.report_date) AS timestamp,
            DATE_FORMAT(MAX(d.report_date), '%b-%y') AS month
        FROM kpi_data d
        LEFT JOIN kpi_name n ON d.kpi_name = n.id
      ${whereClause.length ? "WHERE " + whereClause.filter(w => !w.includes("d.type")).join(" AND ") : ""}
        GROUP BY d.kpi_name, DATE_FORMAT(d.report_date, '%Y-%m')
        ORDER BY MAX(d.report_date);
    `;
        }
        else {
            query = `
      SELECT 
        d.kpi_name,
        n.a_name,
        n.b_name,
        d.type,
        d.a_value,
        d.b_value,
        DATE_FORMAT(d.report_date, '%b-%y') AS month
      FROM kpi_data d
      LEFT JOIN kpi_name n ON d.kpi_name = n.id
     ${whereSQL}
      ORDER BY d.report_date;
    `;
        }


        const result = await new Promise((resolve, reject) => {
            db.query(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
        });

        // Format month in Thai
        const formatted = result.map(item => {
            if (!item.month) return item;
            const [mon, yr] = item.month.split("-");
            const monthIndex = monthEN.indexOf(mon);
            return {
                ...item,
                month: monthTH[monthIndex] + " " + yr
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const kpi_name = req.query.kpi_name || "1";
        const type = req.query.type || "รวม";
        const since = req.query.since;
        const until = req.query.until;

        // Build WHERE clause dynamically
        const whereClause = [];
        const params = [];

        if (kpi_name) {
            whereClause.push("kpi_name = ?");
            params.push(kpi_name);
        }

        if (type && type !== "รวม") {
            whereClause.push("type = ?");
            params.push(type);
        }

        if (since && until) {
            whereClause.push("report_date BETWEEN ? AND ?");
            params.push(since, until);
        } else if (since) {
            whereClause.push("report_date >= ?");
            params.push(since);
        } else if (until) {
            whereClause.push("report_date <= ?");
            params.push(until);
        }

        const whereSQL = whereClause.length ? "WHERE " + whereClause.join(" AND ") : "";
        let query;

        if (type === "รวม") {
            // sum all types per report_date
            query = `
          SELECT 
              DATE_FORMAT(report_date, '%b-%y') AS month,
              SUM(a_value) AS a_value,
              SUM(b_value) AS b_value,
              ROUND(SUM(a_value) / SUM(b_value) * 100, 2) AS result,
              CONCAT(
                  CASE 
                      WHEN ROUND(SUM(a_value) / SUM(b_value) * 100, 2) - 
                           LAG(ROUND(SUM(a_value) / SUM(b_value) * 100, 2)) 
                           OVER (ORDER BY report_date) > 0 
                      THEN '+'
                      ELSE ''
                  END,
                  ROUND(
                      ROUND(SUM(a_value) / SUM(b_value) * 100, 2) -
                      LAG(ROUND(SUM(a_value) / SUM(b_value) * 100, 2)) 
                      OVER (ORDER BY report_date),
                      2
                  ),
                  '%'
              ) AS note
          FROM kpi_data
          ${whereSQL}
          GROUP BY DATE_FORMAT(report_date, '%b-%y')
          ORDER BY report_date;
        `;
        } else {
            query = `
      SELECT 
      DATE_FORMAT(report_date, '%b-%y') AS month,
      a_value, 
      b_value, 
      ROUND((a_value / b_value) * 100, 2) AS result,
        CONCAT(
        CASE 
            WHEN ROUND((a_value / b_value) * 100, 2) - 
                 LAG(ROUND((a_value / b_value) * 100, 2)) 
                 OVER (ORDER BY report_date) > 0 
            THEN '+'
            ELSE ''
        END,
        ROUND(
            ROUND((a_value / b_value) * 100, 2) -
            LAG(ROUND((a_value / b_value) * 100, 2)) OVER (ORDER BY report_date),
            1
        ),
        '%'
    ) AS note
      FROM kpi_data
      ${whereSQL}
      ORDER BY report_date;
    `;
        }

        const result = await new Promise((resolve, reject) => {
            db.query(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
        });

        // Format month in Thai
        const formatted = result.map(item => {
            if (!item.month) return item;
            const [mon, yr] = item.month.split("-");
            const monthIndex = monthEN.indexOf(mon);
            return {
                ...item,
                month: monthTH[monthIndex] + " " + yr
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

exports.dataCurrentMonth = async (req, res) => {
    try {
        const kpi_name = req.query.kpi_name?.trim() || "1";
        const since = req.query.since;
        const until = req.query.until;

        if (!since || !until) {
            return res.status(400).json({ error: "Missing required parameters: since and until" });
        }

        const query = `
      SELECT
        ROUND(SUM(a_value)/NULLIF(SUM(b_value),0)*100, 2) AS sum_rate,
        ROUND(SUM(CASE WHEN type='ไทย' THEN a_value ELSE 0 END)/NULLIF(SUM(CASE WHEN type='ไทย' THEN b_value ELSE 0 END),0)*100, 2) AS thai_rate,
        ROUND(SUM(CASE WHEN type='ต่างชาติ' THEN a_value ELSE 0 END)/NULLIF(SUM(CASE WHEN type='ต่างชาติ' THEN b_value ELSE 0 END),0)*100, 2) AS foreigner_rate
      FROM kpi_data
      WHERE kpi_name = ? AND report_date BETWEEN ? AND ?;
    `;

        const params = [kpi_name, since, until];

        // Execute query with Promise for async/await
        const result = await new Promise((resolve, reject) => {
            db.query(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
        });

        const row = result[0] || {};
        res.json([
            { type: "sum_rate", value: row.sum_rate || 0 },
            { type: "thai_rate", value: row.thai_rate || 0 },
            { type: "foreigner_rate", value: row.foreigner_rate || 0 },
        ]);

    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};