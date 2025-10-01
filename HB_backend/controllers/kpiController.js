const db = require('../mysql.js'); // ⬅️ Import MySQL connection

exports.createdata = (req, res) => {
    const dataArray = req.body; // Expecting an array of objects
    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    const values = dataArray.map(item => [
        item.kpi_name,
        item.a_name,
        item.b_name,
        item.username,
        item.a_value,
        item.b_value,
        item.type,
        item.timestamp
    ]);

    const sql = `
      INSERT INTO kpi_data 
      (kpi_name, a_name, b_name, username, a_value, b_value, type, timestamp) 
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

// controllers/kpiController.js
exports.updateKPIData = (req, res) => {
    const dataArray = req.body; // Expecting array of objects เช่น [{id: 1, kpi_name: "xxx", ...}]
    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    if (dataArray.length === 0) {
        return res.status(400).send("No data provided");
    }

    const updatePromises = dataArray.map((item) => {
        return new Promise((resolve, reject) => {
            const sql = `
                UPDATE kpi_data 
                SET 
                    kpi_name = ?, 
                    a_name = ?, 
                    b_name = ?, 
                    a_value = ?, 
                    b_value = ?, 
                    type = ?,
                    timestamp = ?
                WHERE id = ?
            `;
            const values = [
                item.kpi_name || null,
                item.a_name || null,
                item.b_name || null,
                item.a_value || null,
                item.b_value || null,
                item.type || null,
                item.timestamp || null,
                item.id
            ];

            db.query(sql, values, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });
    });

    Promise.all(updatePromises)
        .then((results) => {
            res.send({ message: "Data updated successfully", results });
        })
        .catch((err) => {
            console.error("Error updating data:", err);
            res.status(500).send("Failed to update data");
        });
};

exports.createKPIName = (req, res) => {
    const dataArray = req.body; // Expecting an array of objects
    if (!Array.isArray(dataArray)) {
        return res.status(400).send("Data must be an array");
    }

    const values = dataArray.map(item => [
        item.kpi_name,
    ]);

    const sql = `
      INSERT INTO kpi_name
      (kpi_name) 
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
        SET kpi_name = ? 
        WHERE id = ?
    `;

    const promises = dataArray.map(item => {
        return new Promise((resolve, reject) => {
            db.query(sql, [item.kpi_name, item.id], (err, result) => {
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

const monthTH = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
    "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
    "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];

exports.getData = (req, res) => {
    const kpi_name = req.query.kpi_name || "1";
    const type = req.query.type || "รวม";
    const chart = req.query.chart || "percent";
    const since = req.query.since;
    const until = req.query.until;

    // Build WHERE clause dynamically
    const whereClause = [];
    const params = [];

    if (kpi_name) {
        whereClause.push("kpi_name = ?");
        params.push(kpi_name);
    }

    if (type && chart !== "percent") {
        whereClause.push("type = ?");
        params.push(type);
    }
    if (since && until) {
        whereClause.push("timestamp BETWEEN ? AND ?");
        params.push(since, until);
    } else if (since) {
        whereClause.push("timestamp >= ?");
        params.push(since);
    } else if (until) {
        whereClause.push("timestamp <= ?");
        params.push(until);
    }

    let query;

    if (chart === "percent") {
        query = `
      SELECT 
        kpi_name,
        a_name,
        b_name,
        type,
        ROUND((a_value / b_value) * 100, 2) AS result,
        DATE_FORMAT(timestamp, '%b-%y') AS month
      FROM kpi_data
      ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
      ORDER BY timestamp;
    `;
    } else {
        query = `
      SELECT 
        kpi_name,
        a_name,
        b_name,
        type,
        a_value,
        b_value,
        DATE_FORMAT(timestamp, '%b-%y') AS month
      FROM kpi_data
      ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
      ORDER BY timestamp;
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

    if (type) {
        whereClause.push("type = ?");
        params.push(type);
    }
    if (since && until) {
        whereClause.push("timestamp BETWEEN ? AND ?");
        params.push(since, until);
    } else if (since) {
        whereClause.push("timestamp >= ?");
        params.push(since);
    } else if (until) {
        whereClause.push("timestamp <= ?");
        params.push(until);
    }

    let query;

    query = `
      SELECT 
      DATE_FORMAT(timestamp, '%b-%y') AS month,
      a_value, 
      b_value, 
      ROUND((a_value / b_value) * 100, 2) AS result,
        CONCAT(
        CASE 
            WHEN ROUND((a_value / b_value) * 100, 2) - 
                 LAG(ROUND((a_value / b_value) * 100, 2)) 
                 OVER (ORDER BY TIMESTAMP) > 0 
            THEN '+'
            ELSE ''
        END,
        ROUND(
            ROUND((a_value / b_value) * 100, 2) -
            LAG(ROUND((a_value / b_value) * 100, 2)) OVER (ORDER BY TIMESTAMP),
            1
        ),
        '%'
    ) AS note
      FROM kpi_data
      ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
      ORDER BY timestamp;
    `;

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
    const kpi_name = req.query.kpi_name || "1";
    const whereClause = ["kpi_name = ?"];
    const params = [kpi_name];
    const query = `
    SELECT 
      DATE_FORMAT(timestamp, '%b-%y') AS month,
      type,
      ROUND((a_value / b_value) * 100, 2) AS result,
      CONCAT(
        CASE 
            WHEN ROUND((a_value / b_value) * 100, 2) - 
                 LAG(ROUND((a_value / b_value) * 100, 2)) 
                 OVER (PARTITION BY type ORDER BY timestamp) > 0 
            THEN '+'
            ELSE ''
        END,
        ROUND(
          ROUND((a_value / b_value) * 100, 2) -
          LAG(ROUND((a_value / b_value) * 100, 2)) OVER (PARTITION BY type ORDER BY timestamp),
          1
        ),
        '%'
      ) AS note
    FROM kpi_data
    ${whereClause.length ? "WHERE " + whereClause.join(" AND ") : ""}
    ORDER BY timestamp;
  `;

    db.query(query, params, (err, result) => {
        if (err) {
            return res.status(400).send({ error: 'Database query failed', details: err });
        }

        if (!result.length) return res.send([]);

        // Get the latest month
        const months = [...new Set(result.map(r => r.month))];
        const latestMonth = months[months.length - 1];

        // Filter for latest month only
        const latestData = result.filter(r => r.month === latestMonth);

        // Convert month to Thai format
        const monthsEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthsTH = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

        const formatted = latestData.map(item => {
            const [mon, yr] = item.month.split("-");
            const monthIndex = monthsEN.indexOf(mon);
            const year = `20${yr}`;
            return {
                type: item.type,
                result: `${item.result}%`,
                note: item.note,
                month: `${monthsTH[monthIndex]} ${year}`
            };
        });

        res.send(formatted);
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

exports.getKPIData = (req, res) => {
    const { kpi_name } = req.query;

    let query = `SELECT * FROM kpi_data`;
    const params = [];

    if (kpi_name) {
        query += ` WHERE kpi_name = ?`;
        params.push(kpi_name);
    }

    db.query(query, params, (err, result) => {
        if (err) {
            res.status(400).send({ error: 'Database query failed', details: err });
        } else {
            res.send(result);
        }
    });
};
