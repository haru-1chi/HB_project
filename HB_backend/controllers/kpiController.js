const db = require('../mysql.js'); // ⬅️ Import MySQL connection

// const queryAsync = (sql, params = []) =>
//     new Promise((resolve, reject) => {
//         db.query(sql, params, (err, results) => (err ? reject(err) : resolve(results)));
//     });

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

        // Build dynamic OR conditions
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

        // ✅ mysql2/promise style
        const [existingRecords] = await db.query(sql, values);

        // Convert to Map for fast lookup
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
        const normalizeKey = (item) =>
            `${item.kpi_name}_${item.type}_${item.report_date.slice(0, 7)}`;

        const normalizedData = data.map((item) => ({
            ...item,
            reportMonth: item.report_date.slice(0, 7),
            key: normalizeKey(item),
        }));

        const placeholders = normalizedData
            .map(
                () => "(kpi_name = ? AND type = ? AND DATE_FORMAT(report_date, '%Y-%m') = ?)"
            )
            .join(" OR ");

        const values = normalizedData.flatMap((item) => [
            item.kpi_name,
            item.type,
            item.reportMonth,
        ]);

        const [existing] = await db.query(
            `
      SELECT kpi_name, type,
             DATE_FORMAT(report_date, '%Y-%m') AS report_month
      FROM kpi_data
      WHERE ${placeholders}
    `,
            values
        );

        const existingMap = new Map(
            existing.map((e) => [`${e.kpi_name}_${e.type}_${e.report_month}`, true])
        );

        if (mode === "overwrite") {
            let inserted = 0;
            let updated = 0;

            for (const item of normalizedData) {
                const key = item.key;

                if (existingMap.has(key)) {
                    // UPDATE
                    await db.query(
                        `
            UPDATE kpi_data 
            SET a_value = ?, b_value = ?, updated_by = ?, updated_at = NOW()
            WHERE kpi_name = ? 
              AND type = ? 
              AND DATE_FORMAT(report_date, '%Y-%m') = ?
          `,
                        [
                            item.a_value,
                            item.b_value,
                            userName,
                            item.kpi_name,
                            item.type,
                            item.reportMonth,
                        ]
                    );
                    updated++;
                } else {
                    await db.query(
                        `
            INSERT INTO kpi_data 
              (kpi_name, a_value, b_value, type, report_date, created_by, updated_by, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
          `,
                        [
                            item.kpi_name,
                            item.a_value,
                            item.b_value,
                            item.type,
                            item.report_date,
                            userName,
                            userName,
                        ]
                    );
                    inserted++;
                }
            }

            return res.json({
                message: "Operation complete",
                inserted,
                updated,
            });
        }

        if (mode === "skip") {
            const newData = normalizedData.filter((item) => !existingMap.has(item.key));

            if (newData.length === 0)
                return res.json({ message: "No new records to insert" });

            const insertValues = newData.map((item) => [
                item.kpi_name,
                item.a_value,
                item.b_value,
                item.type,
                item.report_date,
                userName,
                userName,
                new Date(),
            ]);

            await db.query(
                `
        INSERT INTO kpi_data
          (kpi_name, a_value, b_value, type, report_date, created_by, updated_by, updated_at)
        VALUES ?
      `,
                [insertValues]
            );

            return res.json({ message: "Inserted new records", count: newData.length });
        }
    } catch (err) {
        console.error("createOrUpdate error:", err);
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
    const rows = req.body;

    if (!Array.isArray(rows) || rows.length !== 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid request. Expected a single row.",
        });
    }

    const row = rows[0];
    const { id, kpi_name, a_value, b_value, type, report_date } = row;

    try {
        // 1) Duplicate check
        const dupSQL = `
      SELECT id 
      FROM kpi_data
      WHERE kpi_name = ?
        AND type = ?
        AND DATE_FORMAT(report_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
        AND id != ?
      LIMIT 1
    `;

        const [dup] = await db.execute(dupSQL, [
            kpi_name,
            type,
            report_date,
            id,
        ]);

        if (dup.length > 0) {
            return res.status(409).json({
                success: false,
                message: "ข้อมูลซ้ำกับแถวอื่น",
            });
        }

        // 2) Update single row
        const updateSQL = `
      UPDATE kpi_data
      SET 
        kpi_name = ?, 
        a_value = ?, 
        b_value = ?, 
        type = ?, 
        report_date = ?, 
        updated_by = ?, 
        updated_at = NOW()
      WHERE id = ?
      LIMIT 1
    `;

        const updatedBy = req.user?.name || "Unknown User";

        await db.execute(updateSQL, [
            kpi_name,
            a_value,
            b_value,
            type,
            report_date,
            updatedBy,
            id,
        ]);

        return res.json({
            success: true,
            message: "อัปเดตข้อมูลสำเร็จ",
        });

    } catch (err) {
        console.error("❌ UpdateKPIData Error:", err);
        return res.status(500).json({
            success: false,
            message: "เกิดข้อผิดพลาดระหว่างอัปเดตข้อมูล",
        });
    }
};

exports.deleteKPIData = async (req, res) => {
    try {
        let { id } = req.params;
        let { ids } = req.body;

        if (id) ids = [id];
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one ID is required",
            });
        }

        const safeIds = [...new Set(
            ids
                .map(v => parseInt(v, 10))
                .filter(v => Number.isInteger(v) && v > 0)
        )];

        if (safeIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format",
            });
        }

        const sql = `DELETE FROM kpi_data WHERE id IN (${safeIds.map(() => "?").join(",")})`;

        const [result] = await db.query(sql, safeIds);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "No data found for provided IDs",
            });
        }

        return res.json({
            success: true,
            message: `Deleted ${result.affectedRows} record(s)`,
            deletedCount: result.affectedRows,
        });
    } catch (err) {
        console.error("❌ Delete error:", err);
        return res.status(500).json({
            success: false,
            message: "Database error",
        });
    }
};


exports.getKPIData = async (req, res) => {
    try {
        const { kpi_name, search, sinceDate, endDate } = req.query;

        const kpiId = Number(kpi_name);
        if (!kpiId) return res.json([]);

        let sql = `
      SELECT d.*, n.kpi_name AS kpi_label, n.a_name, n.b_name
      FROM kpi_data d
      LEFT JOIN kpi_name n ON d.kpi_name = n.id
      WHERE 1 = 1
    `;

        const params = [];

        // -------------------------------
        // FILTER: KPI name
        // -------------------------------
        if (kpi_name) {
            sql += ` AND d.kpi_name = ?`;
            params.push(kpi_name);
        }

        // -------------------------------
        // FILTER: SEARCH TEXT
        // -------------------------------
        if (search) {
            let formattedSearch = search;

            // Detect MM/YYYY pattern
            const match = /^(\d{2})\/(\d{4})$/.exec(search);
            if (match) {
                const [_, mm, yyyy] = match;
                formattedSearch = `${yyyy}-${mm}`; // convert to YYYY-MM
            }

            sql += `
        AND (
          d.a_value LIKE ? OR
          d.b_value LIKE ? OR
          d.type LIKE ? OR
          d.report_date LIKE ? OR
          d.issue_details LIKE ? OR
          d.support_details LIKE ?
        )
      `;

            params.push(
                `%${search}%`,
                `%${search}%`,
                `%${search}%`,
                `%${formattedSearch}%`,
                `%${search}%`,
                `%${search}%`,
            );
        }

        // -------------------------------
        // FILTER: DATE RANGE
        // -------------------------------
        if (sinceDate && endDate) {
            sql += ` 
        AND DATE_FORMAT(d.report_date, '%Y-%m')
        BETWEEN DATE_FORMAT(?, '%Y-%m') AND DATE_FORMAT(?, '%Y-%m')
      `;
            params.push(sinceDate, endDate);
        } else if (sinceDate) {
            sql += ` 
        AND DATE_FORMAT(d.report_date, '%Y-%m') >= DATE_FORMAT(?, '%Y-%m')
      `;
            params.push(sinceDate);
        } else if (endDate) {
            sql += ` 
        AND DATE_FORMAT(d.report_date, '%Y-%m') <= DATE_FORMAT(?, '%Y-%m')
      `;
            params.push(endDate);
        }

        sql += ` ORDER BY d.report_date ASC`;

        // -------------------------------
        // RUN QUERY (mysql2/promise)
        // -------------------------------
        const [rows] = await db.query(sql, params);

        return res.status(200).json(rows ?? []);
    } catch (err) {
        console.error("❌ Error fetching KPI data:", err);
        return res.status(500).json([]);
    }
};

//kpi name--------------------------------------------------------------------------
exports.createKPIName = async (req, res) => {
    try {
        const dataArray = req.body;
        const userName = req.user?.name || "Unknown User";

        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Data must be a non-empty array",
            });
        }

        // ⭐ ใช้ mysql2/promise
        const [maxRows] = await db.query(
            "SELECT COALESCE(MAX(order_sort), 0) AS maxOrder FROM kpi_name"
        );

        let nextOrder = maxRows[0].maxOrder;

        const values = dataArray.map((item) => {
            nextOrder++;
            return [
                item.kpi_name,
                item.a_name ?? null,
                item.b_name ?? null,
                item.kpi_type ?? null,
                item.unit_type ?? null,
                item.unit_value ?? null,
                item.unit_label ?? null,
                item.target_direction ?? null,
                item.max_value ?? null,
                nextOrder,
                userName,
            ];
        });

        const sql = `
      INSERT INTO kpi_name
      (kpi_name, a_name, b_name, kpi_type, unit_type, unit_value, unit_label, target_direction, max_value, order_sort, created_by)
      VALUES ?
    `;

        const [result] = await db.query(sql, [values]);

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
    try {
        const dataArray = req.body;
        const userName = req.user?.name || "Unknown User";

        if (!Array.isArray(dataArray) || dataArray.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Data must be a non-empty array",
            });
        }

        const fields = [
            "kpi_name",
            "a_name",
            "b_name",
            "kpi_type",
            "unit_type",
            "unit_value",
            "unit_label",
            "target_direction",
            "max_value",
        ];

        // เตรียม CASE WHEN
        const cases = {};
        fields.forEach((f) => (cases[f] = []));

        const ids = [];
        const params = []; // ⭐ ใส่ค่าแทน db.escape

        dataArray.forEach((item) => {
            ids.push(item.id);

            fields.forEach((f) => {
                cases[f].push(`WHEN ? THEN ?`);
                params.push(item.id, item[f] ?? null);
            });
        });

        // ประกอบ SQL CASE
        const sql = `
      UPDATE kpi_name
      SET
        ${fields
                .map((f) => `${f} = CASE id ${cases[f].join(" ")} END`)
                .join(", ")},
        updated_by = ?,
        updated_at = NOW()
      WHERE id IN (${ids.map(() => "?").join(",")})
    `;

        params.push(userName, ...ids);

        // ⭐ รันด้วย mysql2/promise
        const [result] = await db.query(sql, params);

        res.json({
            success: true,
            message: `✅ Updated ${dataArray.length} record(s) successfully`,
        });
    } catch (err) {
        console.error("❌ Error updating KPI names:", err);
        res.status(500).json({
            success: false,
            message: "Failed to update data",
            error: err.message,
        });
    }
};

exports.deleteKPIName = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID is required",
            });
        }

        const sql = `
      UPDATE kpi_name
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

        const [result] = await db.query(sql, [id]);

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
        const type = req.query.type;

        let conditions = [];
        let params = [];

        if (!includeDeleted) {
            conditions.push("k.deleted_at IS NULL");
        }

        if (type) {
            conditions.push("k.kpi_type = ?");
            params.push(Number(type));
        }

        const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

        const sql = `
            SELECT 
                k.id,
                CASE 
                    WHEN k.deleted_at IS NOT NULL THEN CONCAT(k.kpi_name, ' (ข้อมูลไม่ใช้แล้ว)')
                    ELSE k.kpi_name
                END AS kpi_name,
                k.a_name,
                k.b_name,
                k.kpi_type,
                q.quality_name AS kpi_type_label,
                k.unit_type,
                k.unit_value,
                k.unit_label,
                k.target_direction,
                k.max_value,
                k.deleted_at,
                k.order_sort
            FROM kpi_name k
            LEFT JOIN quality_type q ON k.kpi_type = q.id
            ${where}
            ORDER BY k.order_sort ASC
        `;

        const [rows] = await db.query(sql, params);

        res.status(200).json(rows || []);
    } catch (err) {
        console.error("❌ Error fetching KPI names:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch KPI names",
            error: err.message,
        });
    }
};

exports.getKPINameGroup = async (req, res) => {
    try {
        const includeDeleted = req.query.includeDeleted === "true";
        const type = req.query.type;

        let conditions = [];
        if (!includeDeleted) conditions.push("k.deleted_at IS NULL");
        if (type) conditions.push("k.kpi_type = " + Number(type));

        const where =
            conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

        const query = `
      SELECT 
        k.id,
        k.kpi_name,
        k.a_name,
        k.b_name,
        k.kpi_type,
        q.quality_name AS kpi_type_label,
        k.unit_type,
        k.unit_value,
        k.unit_label,
        k.target_direction,
        k.max_value,
        k.deleted_at,
        k.order_sort
      FROM kpi_name k
      LEFT JOIN quality_type q ON k.kpi_type = q.id
      ${where}
      ORDER BY k.kpi_type, k.order_sort ASC
    `;

        const [rows] = await db.query(query);
        const result = [];

        rows.forEach((item) => {
            let group = result.find((g) => g.kpi_type === item.kpi_type);

            if (!group) {
                group = {
                    label: item.kpi_type_label ?? "ตัวชี้วัดยังไม่ได้จัดหมวดหมู่",
                    kpi_type: item.kpi_type,
                    items: [],
                };
                result.push(group);
            }

            group.items.push(item);
        });

        res.status(200).json(result);
    } catch (err) {
        console.error("❌ Error fetching KPI names:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch KPI names",
            error: err.message,
        });
    }
};


exports.reorderKPIName = async (req, res) => {
    try {
        const items = req.body.items;
        const userName = req.user?.name || "Unknown User";

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Items must be a non-empty array",
            });
        }

        // Build CASE WHEN statements
        const ids = items.map((item) => item.id);
        const orderCases = items.map(
            (item) => `WHEN ${item.id} THEN ${db.escape(item.order_sort)}`
        );

        const sql = `
      UPDATE kpi_name
      SET 
        order_sort = CASE id
          ${orderCases.join(" ")}
        END,
        updated_by = ${db.escape(userName)},
        updated_at = NOW()
      WHERE id IN (${ids.join(",")})
    `;

        const [result] = await db.query(sql);

        res.json({
            success: true,
            message: `Updated order of ${items.length} record(s) successfully`,
        });
    } catch (error) {
        console.error("❌ Error updating order_sort:", error);
        res.status(500).json({
            success: false,
            message: "Failed to reorder KPI names",
            error: error.message,
        });
    }
};

exports.getQualityType = async (req, res) => {
    try {
        const query = `
      SELECT *
      FROM quality_type
    `;

        const [rows] = await db.query(query);

        res.status(200).json(rows ?? []);
    } catch (err) {
        console.error("❌ Error fetching quality types:", err);
        res.status(500).json({
            success: false,
            message: "Failed to fetch quality types",
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

        if (!kpi_name) return res.json([]);

        const where = [];
        const params = [];

        if (kpi_name) {
            where.push("d.kpi_name = ?");
            params.push(kpi_name);
        }

        if (since && until) {
            where.push("d.report_date BETWEEN ? AND ?");
            params.push(since, until);
        } else if (since) {
            where.push("d.report_date >= ?");
            params.push(since);
        } else if (until) {
            where.push("d.report_date <= ?");
            params.push(until);
        }

        const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

        let query = "";

        if (chart === "percent") {
            if (type === "รวม") {
                query = `
          SELECT
            d.kpi_name,
            n.a_name,
            n.b_name,
            'รวม' AS type,
            COALESCE(ROUND(SUM(d.a_value) / SUM(d.b_value) * n.unit_value, 2), 0) AS result,
            n.max_value,
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
            COALESCE(ROUND((d.a_value / d.b_value) * n.unit_value, 2), 0) AS result,
            n.max_value,
            DATE_FORMAT(d.report_date, '%b-%y') AS month,
            DATE_FORMAT(d.report_date, '%Y-%m') AS month_key
          FROM kpi_data d
          LEFT JOIN kpi_name n ON d.kpi_name = n.id
          ${whereSQL ? whereSQL + " AND d.type = ?" : "WHERE d.type = ?"}
          ORDER BY month_key;
        `;
                params.push(type);
            }
        } else {
            const whereNoType = where.filter(w => !w.includes("d.type"));
            const where2 = whereNoType.length
                ? "WHERE " + whereNoType.join(" AND ")
                : "";

            query = `
        SELECT
          d.kpi_name,
          DATE_FORMAT(d.report_date, '%Y-%m') AS month_key,
          DATE_FORMAT(d.report_date, '%b-%y') AS month,
          n.a_name,
          n.b_name,
          n.max_value,
          COALESCE(
            ROUND(MAX(CASE WHEN d.type = 'ไทย' THEN (d.a_value / d.b_value) * n.unit_value END), 2),
            0
          ) AS percent_th,
          COALESCE(
            ROUND(MAX(CASE WHEN d.type = 'ต่างชาติ' THEN (d.a_value / d.b_value) * n.unit_value END), 2),
            0
          ) AS percent_en
        FROM kpi_data d 
        LEFT JOIN kpi_name n ON d.kpi_name = n.id
        ${where2}
        GROUP BY
          d.kpi_name,
          DATE_FORMAT(d.report_date, '%Y-%m'),
          n.a_name,
          n.b_name
        ORDER BY
          DATE_FORMAT(d.report_date, '%Y-%m');
      `;
        }

        const [rows] = await db.query(query, params);

        const formatted = rows.map(item => {
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
        res.status(500).json({
            error: "Internal server error",
            details: err.message
        });
    }
};

exports.getDetail = async (req, res) => {
    try {
        const kpi_name = req.query.kpi_name?.trim();
        const since = req.query.since || "2025-01-01";
        const until = req.query.until || "2025-12-31";

        // Parameters (used 1 time in WHERE of CTE)
        const params = [kpi_name, since, until];

        const query = `
            WITH summary AS (
                SELECT 
                    DATE_FORMAT(d.report_date, '%b-%y') AS month,
                    SUM(CASE WHEN d.type = 'ไทย' THEN d.a_value ELSE 0 END) AS sum_a_thai,
                    SUM(CASE WHEN d.type = 'ไทย' THEN d.b_value ELSE 0 END) AS sum_b_thai,
                    SUM(CASE WHEN d.type = 'ต่างชาติ' THEN d.a_value ELSE 0 END) AS sum_a_foreign,
                    SUM(CASE WHEN d.type = 'ต่างชาติ' THEN d.b_value ELSE 0 END) AS sum_b_foreign,
                    SUM(d.a_value) AS sum_a_total,
                    SUM(d.b_value) AS sum_b_total,
                    MIN(d.report_date) AS report_date,
                    d.kpi_name
                FROM kpi_data d
                WHERE d.kpi_name = ? 
                  AND d.report_date BETWEEN ? AND ?
                GROUP BY DATE_FORMAT(d.report_date, '%b-%y'), d.kpi_name
            )
            SELECT 
                s.month,
                COALESCE(ROUND((s.sum_a_thai / NULLIF(s.sum_b_thai, 0)) * n.unit_value, 2), 0) AS result_thai,
                COALESCE(ROUND((s.sum_a_foreign / NULLIF(s.sum_b_foreign, 0)) * n.unit_value, 2), 0) AS result_foreign,
                COALESCE(ROUND((s.sum_a_total / NULLIF(s.sum_b_total, 0)) * n.unit_value, 2), 0) AS result_total,
                COALESCE(
                    CONCAT(
                        CASE 
                            WHEN 
                                ROUND((s.sum_a_total / NULLIF(s.sum_b_total, 0)) * n.unit_value, 2)
                                - LAG(
                                    ROUND((s.sum_a_total / NULLIF(s.sum_b_total, 0)) * n.unit_value, 2)
                                ) OVER (ORDER BY s.report_date) > 0 
                            THEN '+'
                            ELSE ''
                        END,
                        ROUND(
                            ROUND((s.sum_a_total / NULLIF(s.sum_b_total, 0)) * n.unit_value, 2)
                            - LAG(
                                ROUND((s.sum_a_total / NULLIF(s.sum_b_total, 0)) * n.unit_value, 2)
                            ) OVER (ORDER BY s.report_date),
                            2
                        )
                    ),
                    '0'
                ) AS note
            FROM summary s
            LEFT JOIN kpi_name n ON n.id = s.kpi_name
            ORDER BY STR_TO_DATE(CONCAT('01-', s.month), '%d-%b-%y')
        `;

        const [rows] = await db.query(query, params);

        const formatted = rows.map(item => {
            if (!item.month) return item;
            const [mon, yr] = item.month.split("-");
            const monthIndex = monthEN.indexOf(mon);
            return {
                ...item,
                month: `${monthTH[monthIndex]} ${yr}`,
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).json({
            error: "Internal server error",
            details: err.message
        });
    }
};



exports.dataCurrentMonth = async (req, res) => {
    try {
        const kpi_name = req.query.kpi_name?.trim();
        const since = req.query.since;
        const until = req.query.until;

        if (!since || !until) {
            return res.status(400).json({ error: "Missing required parameters: since and until" });
        }

        const query = `
            SELECT
                ROUND(SUM(d.a_value)/NULLIF(SUM(d.b_value),0)*n.unit_value, 2) AS sum_rate,
                ROUND(SUM(CASE WHEN d.type='ไทย' THEN d.a_value ELSE 0 END)/NULLIF(SUM(CASE WHEN d.type='ไทย' THEN d.b_value ELSE 0 END),0)*n.unit_value, 2) AS thai_rate,
                ROUND(SUM(CASE WHEN d.type='ต่างชาติ' THEN d.a_value ELSE 0 END)/NULLIF(SUM(CASE WHEN d.type='ต่างชาติ' THEN d.b_value ELSE 0 END),0)*n.unit_value, 2) AS foreigner_rate,
                CAST(CONCAT(SUM(d.a_value), '/', SUM(d.b_value)) AS CHAR) AS sum_raw,
                CAST(CONCAT(
                    SUM(CASE WHEN d.type='ไทย' THEN d.a_value ELSE 0 END),
                    '/',
                    SUM(CASE WHEN d.type='ไทย' THEN d.b_value ELSE 0 END)
                ) AS CHAR) AS thai_raw,
                CAST(CONCAT(
                    SUM(CASE WHEN d.type='ต่างชาติ' THEN d.a_value ELSE 0 END),
                    '/',
                    SUM(CASE WHEN d.type='ต่างชาติ' THEN d.b_value ELSE 0 END)
                ) AS CHAR) AS foreigner_raw,
                n.max_value
            FROM kpi_data d
            LEFT JOIN kpi_name n ON d.kpi_name = n.id
            WHERE d.kpi_name = ? AND d.report_date BETWEEN ? AND ?;
        `;

        const params = [kpi_name, since, until];

        const [rows] = await db.query(query, params);

        const row = rows[0] || {};
        res.json([
            { type: "sum_rate", value: row.sum_rate ?? 0, raw_value: row.sum_raw ?? "0/0", max_value: row.max_value ?? 0 },
            { type: "thai_rate", value: row.thai_rate ?? 0, raw_value: row.thai_raw ?? "0/0", max_value: row.max_value ?? 0 },
            { type: "foreigner_rate", value: row.foreigner_rate ?? 0, raw_value: row.foreigner_raw ?? "0/0", max_value: row.max_value ?? 0 },
        ]);

    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};