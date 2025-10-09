const db = require('../mysql.js'); // ⬅️ Import MySQL connection

exports.checkDuplicates = (req, res) => {
    const dataArray = req.body;
    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    const conditions = dataArray.map(() => "(d.kpi_name = ? AND d.type = ? AND DATE_FORMAT(d.report_date, '%Y-%m') = ?)").join(" OR ");
    const values = dataArray.flatMap(item => [
        item.kpi_name,
        item.type,
        item.report_date.slice(0, 7) // only YYYY-MM
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


    db.query(sql, values, (err, existing) => {
        if (err) return res.status(500).send(err);

        // Build paired list
        const result = [];
        for (const newItem of dataArray) {
            const oldItem = existing.find(
                (e) =>
                    e.kpi_id === newItem.kpi_name && // compare by id!
                    e.type === newItem.type &&
                    String(e.report_date).slice(0, 7) === String(newItem.report_date).slice(0, 7)
            );

            if (oldItem) {
                result.push(
                    {
                        status: "เดิม",
                        kpi_name: oldItem.kpi_label,
                        a_value: oldItem.a_value,
                        b_value: oldItem.b_value,
                        type: oldItem.type,
                        report_date: oldItem.report_date,
                    },
                    {
                        status: "ใหม่",
                        kpi_name: oldItem.kpi_label,
                        a_value: newItem.a_value,
                        b_value: newItem.b_value,
                        type: newItem.type,
                        report_date: newItem.report_date,
                    }
                );
            }
        }

        res.json({ pairs: result, totalChecked: dataArray.length });
    });
};

exports.createOrUpdate = (req, res) => {
    const { data, mode } = req.body;
    const createdBy = req.user?.name || "Unknown User";
    const updatedBy = createdBy;

    if (!Array.isArray(data)) return res.status(400).send("Data must be an array");

    // if overwrite -> update if exists else insert
    if (mode === "overwrite") {
        const promises = data.map(item => new Promise((resolve, reject) => {
            const updateSql = `
        UPDATE kpi_data 
        SET 
          a_value = ?, 
          b_value = ?, 
          updated_by = ?, 
          updated_at = NOW()
        WHERE kpi_name = ? AND type = ? AND DATE_FORMAT(report_date, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')
      `;

            const updateVals = [
                item.a_value,
                item.b_value,
                updatedBy,
                item.kpi_name,
                item.type,
                item.report_date
            ];

            db.query(updateSql, updateVals, (err, result) => {
                if (err) return reject(err);

                if (result.affectedRows === 0) {
                    // no existing -> insert new
                    const insertSql = `
                    INSERT INTO kpi_data
                    (kpi_name, a_value, b_value, type, report_date, created_by, updated_by, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())

          `;
                    const insertVals = [
                        item.kpi_name,
                        item.a_value,
                        item.b_value,
                        item.type,
                        item.report_date,
                        createdBy,
                        ''
                    ];
                    db.query(insertSql, insertVals, (insertErr, insertRes) => {
                        if (insertErr) reject(insertErr);
                        else resolve(insertRes);
                    });
                } else {
                    resolve(result);
                }
            });
        }));

        Promise.all(promises)
            .then(() => res.send("Overwritten or inserted as needed"))
            .catch(err => res.status(500).send(err));
    }
    else if (mode === "skip") {
        // Step 1: Check which records already exist
        const conditions = data
            .map(() => "(kpi_name = ? AND type = ? AND DATE_FORMAT(report_date, '%Y-%m') = ?)")
            .join(" OR ");
        const values = data.flatMap((item) => [
            item.kpi_name,
            item.type,
            item.report_date.slice(0, 7),
        ]);

        const checkSql = `
      SELECT kpi_name, type, DATE_FORMAT(report_date, '%Y-%m') AS report_month
      FROM kpi_data
      WHERE ${conditions}
    `;

        db.query(checkSql, values, (err, existing) => {
            if (err) return res.status(500).send(err);

            // Step 2: Filter new items (skip existing ones)
            const newData = data.filter((item) => {
                return !existing.some(
                    (e) =>
                        e.kpi_name === item.kpi_name &&
                        e.type === item.type &&
                        e.report_month === item.report_date.slice(0, 7)
                );
            });

            if (newData.length === 0) {
                return res.send("No new records to insert");
            }

            // Step 3: Insert only new records
            const insertSql = `
        INSERT INTO kpi_data 
        (kpi_name, a_value, b_value, type, report_date, created_by)
        VALUES ?
      `;
            const insertValues = newData.map((item) => [
                item.kpi_name,
                item.a_value,
                item.b_value,
                item.type,
                item.report_date,
                createdBy,
            ]);

            db.query(insertSql, [insertValues], (err2) => {
                if (err2) return res.status(500).send(err2);
                res.send(`Inserted ${newData.length} non-duplicate records`);
            });
        });
    }
    else {
        res.status(400).send("Invalid mode");
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

    const ids = [];
    const fields = ["kpi_name", "a_value", "b_value", "type", "report_date"];

    const cases = {};
    fields.forEach(field => (cases[field] = []));

    dataArray.forEach(item => {
        ids.push(item.id);
        fields.forEach(field => {
            const value = item[field] ?? null;
            cases[field].push(`WHEN ${item.id} THEN ${db.escape(value)}`);
        });
    });

    const updateSQL = `
    UPDATE kpi_data
    SET 
      ${fields.map(f => `${f} = CASE id ${cases[f].join(" ")} END`).join(", ")},
      updated_by = ${db.escape(updatedBy)},
      updated_at = NOW()
    WHERE id IN (${ids.join(",")})
  `;

    db.query(updateSQL, (err, result) => {
        if (err) {
            console.error("❌ Error updating data:", err);
            return res.status(500).send("Failed to update data");
        }
        res.send({ message: "✅ Data updated successfully", affectedRows: result.affectedRows });
    });
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
    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    const values = dataArray.map(item => [
        item.kpi_name,
        item.a_name,
        item.b_name
    ]);

    const sql = `
      INSERT INTO kpi_name
      (kpi_name, a_name, b_name) 
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
    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    const sql = `
        UPDATE kpi_name 
        SET kpi_name = ?, 
            a_name = ?, 
            b_name = ?
        WHERE id = ?
    `;

    const promises = dataArray.map(item => {
        return new Promise((resolve, reject) => {
            db.query(sql, [item.kpi_name, item.a_name, item.b_name, item.id], (err, result) => {
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

    const sql = `DELETE FROM kpi_name WHERE id = ?`;

    db.query(sql, [id], (err, result) => {
        if (err) {
            res.status(400).send(err);
        } else {
            res.send({ message: "Data deleted", result });
        }
    });
};



exports.getKPIName = (req, res) => {
    const query = `
        SELECT 
            *
        FROM kpi_name
    `;

    db.query(query, (err, result) => {
        if (err) {
            res.status(400).send({ error: 'Database query failed', details: err });
        } else {
            res.send(result);
        }
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
      ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
      UNION ALL

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
ORDER BY month_key, type;
    `;
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
          GROUP BY report_date
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
        if (!kpi_name) {
            return res.status(400).json({ error: "Missing required parameter: kpi_name" });
        }

        const query = `
WITH grouped_data AS (
    SELECT 
        report_date,
        type,
        a_value,
        b_value
    FROM kpi_data
    WHERE kpi_name = ?

    UNION ALL

    SELECT 
        report_date,
        'รวม' AS type,
        SUM(a_value) AS a_value,
        SUM(b_value) AS b_value
    FROM kpi_data
    WHERE kpi_name = ?
    GROUP BY report_date
),
ranked_data AS (
    SELECT 
        DATE_FORMAT(report_date, '%b-%y') AS month,
        DATE_FORMAT(LAG(report_date) OVER (PARTITION BY type ORDER BY report_date), '%b-%y') AS prev_month,
        type,
        ROUND((a_value / b_value) * 100, 2) AS result,
        LAG(ROUND((a_value / b_value) * 100, 2)) 
            OVER (PARTITION BY type ORDER BY report_date) AS prev_result,
        report_date
    FROM grouped_data
),
latest_date_cte AS (
    SELECT MAX(report_date) AS latest_date FROM ranked_data
)
SELECT 
    r.type,
    r.result,
    ROUND(r.result - r.prev_result, 1) AS diff,
    CONCAT(
        CASE 
            WHEN r.result - r.prev_result > 0 THEN '+'
            WHEN r.result - r.prev_result < 0 THEN ''
            ELSE ''
        END,
        ROUND(r.result - r.prev_result, 1),
        '%'
    ) AS note,
    r.month,
    r.prev_month
FROM ranked_data r
JOIN latest_date_cte ld ON r.report_date = ld.latest_date
ORDER BY 
    CASE r.type 
        WHEN 'ต่างชาติ' THEN 1
        WHEN 'ไทย' THEN 2
        WHEN 'รวม' THEN 3
        ELSE 4
    END;
        `;

        db.query(query, [kpi_name, kpi_name], (err, result) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database query failed", details: err });
            }

            if (!result.length) return res.json([]);

            const monthsEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const monthTH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

            const formatted = result.map(item => {
                const [mon, yr] = item.month.split("-");
                const monthIndex = monthsEN.indexOf(mon);
                const year = `20${yr}`;

                let prevMonthTH = null;
                if (item.prev_month) {
                    const [pMon, pYr] = item.prev_month.split("-");
                    const pMonthIndex = monthsEN.indexOf(pMon);
                    prevMonthTH = monthTH[pMonthIndex] + " " + `20${pYr}`;
                }

                return {
                    type: item.type,
                    result: `${item.result}%`,
                    note: item.note,
                    month: `${monthTH[monthIndex]} ${year}`,
                    prev_month: prevMonthTH
                };
            });

            res.json(formatted);
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