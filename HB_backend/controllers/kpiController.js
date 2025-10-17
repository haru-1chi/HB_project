const db = require('../mysql.js'); // ⬅️ Import MySQL connection

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
};

exports.updateKPIData = async (req, res) => {
  const dataArray = req.body;
  if (!Array.isArray(dataArray) || dataArray.length === 0) {
    return res.status(400).send("Invalid or empty data array");
  }

  const updatedBy = req.user?.name || "Unknown User";

  try {
    // helper: query function returning promise
    const queryAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

    // 1️⃣ Check duplicate for each item
    for (const item of dataArray) {
      const { id, kpi_name, type, report_date } = item;

      const checkSQL = `
        SELECT id FROM kpi_data 
        WHERE kpi_name = ? 
          AND type = ? 
          AND DATE_FORMAT(report_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
          AND id != ?
      `;

      const dupRows = await queryAsync(checkSQL, [
        kpi_name,
        type,
        report_date,
        id,
      ]);

      if (dupRows.length > 0) {
        // ⚠️ Duplicate found → stop and return
        return res.status(409).json({
          success: false,
          message: "ข้อมูลซ้ำกับแถวอื่น",
          duplicate: true,
        });
      }
    }

    // 2️⃣ Normal update
    const ids = [];
    const fields = ["kpi_name", "a_value", "b_value", "type", "report_date"];
    const cases = {};
    fields.forEach((f) => (cases[f] = []));

    dataArray.forEach((item) => {
      ids.push(item.id);
      fields.forEach((f) => {
        const value = item[f] ?? null;
        cases[f].push(`WHEN ${item.id} THEN ${db.escape(value)}`);
      });
    });

    const updateSQL = `
      UPDATE kpi_data
      SET 
        ${fields.map((f) => `${f} = CASE id ${cases[f].join(" ")} END`).join(", ")},
        updated_by = ${db.escape(updatedBy)},
        updated_at = NOW()
      WHERE id IN (${ids.join(",")})
    `;

    await queryAsync(updateSQL);

    res.json({
      success: true,
      message: "✅ Data updated successfully",
    });
  } catch (err) {
    console.error("❌ Error updating data:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update data",
    });
  }
};

exports.deleteKPIData = (req, res) => {
    let { id } = req.params;
    let { ids } = req.body;

    if (id) ids = [id];
    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).send("At least one ID is required");
    }

    const safeIds = ids.map(Number).filter(Boolean);
    if (safeIds.length === 0) {
        return res.status(400).send("Invalid ID format");
    }

    const sql = `DELETE FROM kpi_data WHERE id IN (${safeIds.map(() => '?').join(',')})`;

    db.query(sql, safeIds, (err, result) => {
        if (err) {
            console.error("❌ Delete error:", err);
            return res.status(500).send("Database error");
        }

        if (result.affectedRows === 0) {
            return res.status(404).send("No data found for provided IDs");
        }

        res.send({
            message: `✅ ${result.affectedRows} record(s) deleted successfully`,
        });
    });
};


exports.getKPIData = (req, res) => {
    const { kpi_name, search } = req.query;
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

    db.query(query, params, (err, result) => {
        if (err) return res.status(400).send({ error: 'Database query failed', details: err });
        res.send(result);
    });
};

//kpi name--------------------------------------------------------------------------
exports.createKPIName = (req, res) => {
    const dataArray = req.body;
    const userName = req.user?.name || "Unknown User";

    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    const values = dataArray.map(item => [
        item.kpi_name,
        item.a_name,
        item.b_name,
        userName
    ]);

    const sql = `
      INSERT INTO kpi_name
      (kpi_name, a_name, b_name, created_by) 
      VALUES ?
    `;

    db.query(sql, [values], (err, result) => {
        if (err) {
            res.status(400).send(err);
        } else {
            res.send("Data inserted");
        }
    });
};

exports.updateKPIName = (req, res) => {
    const dataArray = req.body;
    const userName = req.user?.name || "Unknown User";

    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    const sql = `
        UPDATE kpi_name 
        SET kpi_name = ?, 
            a_name = ?, 
            b_name = ?,
            updated_by = ?,
            updated_at = NOW()
        WHERE id = ?
    `;

    const promises = dataArray.map(item => {
        return new Promise((resolve, reject) => {
            db.query(sql, [item.kpi_name, item.a_name, item.b_name, userName, item.id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });

    Promise.all(promises)
        .then(() => res.send("Data updated"))
        .catch(err => res.status(400).send(err));
};


exports.deleteKPIName = (req, res) => {
    const { id } = req.params; // get id from URL
    if (!id) {
        return res.status(400).send("ID is required");
    }

    const sql = `
    UPDATE kpi_name 
    SET deleted_at = NOW()
    WHERE id = ? AND deleted_at IS NULL
  `;

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error updating deleted_at:", err);
            return res.status(500).send("Database error");
        }
        if (result.affectedRows === 0) {
            return res.status(404).send("Record not found or already deleted");
        }

        res.send({ message: "Record soft deleted successfully", result });
    });
};

exports.getKPIName = (req, res) => {
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
  `;

    db.query(query, (err, result) => {
        if (err)
            return res.status(400).send({ error: "Database query failed", details: err });
        res.send(result);
    });
};

//dashboard--------------------------------------------------------------------------
exports.getData = (req, res) => {
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
          ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
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
      ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
      ORDER BY d.report_date;
    `;
        }


        db.query(query, [...params, ...params], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: 'Database query failed' });
            }

            const formatted = result.map(item => {
                const [mon, yr] = item.month.split("-");
                const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(mon);
                return {
                    ...item,
                    month: monthTH[monthIndex] + " " + yr
                };
            });

            res.json(formatted);
        });
    } catch (err) {
        console.error("Unexpected error:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getDetail = (req, res) => {
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
          ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
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
      ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
      ORDER BY report_date;
    `;
    }

    db.query(query, params, (err, result) => {
        if (err) {
            res.status(400).send({ error: 'Database query failed', details: err });
        } else {
            const formatted = result.map(item => {
                const [mon, yr] = item.month.split("-");
                const monthsEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                const monthIndex = monthsEN.indexOf(mon);
                const year = yr;
                return {
                    ...item,
                    month: monthTH[monthIndex] + " " + year
                };
            });
            res.send(formatted);
        }
    });
};

exports.dataCurrentMonth = (req, res) => {
    try {
        const kpi_name = req.query.kpi_name?.trim() || "1";
        const since = req.query.since;
        const until = req.query.until;

        if (!since || !until) {
            return res.status(400).json({ error: "Missing required parameters: since and until" });
        }

        const query = `
  SELECT
    ROUND(
      (SUM(CASE WHEN kpi_name = ? AND report_date BETWEEN ? AND ? THEN a_value ELSE 0 END) /
       SUM(CASE WHEN kpi_name = ? AND report_date BETWEEN ? AND ? THEN b_value ELSE 0 END)) * 100, 
    2) AS sum_rate,

    ROUND(
      (SUM(CASE WHEN kpi_name = ? AND type = 'ไทย' AND report_date BETWEEN ? AND ? THEN a_value ELSE 0 END) /
       SUM(CASE WHEN kpi_name = ? AND type = 'ไทย' AND report_date BETWEEN ? AND ? THEN b_value ELSE 0 END)) * 100, 
    2) AS thai_rate,

    ROUND(
      (SUM(CASE WHEN kpi_name = ? AND type = 'ต่างชาติ' AND report_date BETWEEN ? AND ? THEN a_value ELSE 0 END) /
       SUM(CASE WHEN kpi_name = ? AND type = 'ต่างชาติ' AND report_date BETWEEN ? AND ? THEN b_value ELSE 0 END)) * 100, 
    2) AS foreigner_rate
  FROM kpi_data;
`;


        const params = [
            // sum_rate
            kpi_name, since, until,
            kpi_name, since, until,
            // thai_rate
            kpi_name, since, until,
            kpi_name, since, until,
            // foreigner_rate
            kpi_name, since, until,
            kpi_name, since, until
        ];

        db.query(query, params, (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database query failed", details: err });
            }

            res.json([
                { type: "sum_rate", value: result[0].sum_rate },
                { type: "thai_rate", value: result[0].thai_rate },
                { type: "foreigner_rate", value: result[0].foreigner_rate },
            ]);

        });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.status(500).json({ error: "Internal server error", details: error.message });
    }
};


const monthTH = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
    "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
    "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

const monthsEN = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];