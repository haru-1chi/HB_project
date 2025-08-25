const db = require('../mysql.js'); // ⬅️ Import MySQL connection

// exports.createdata = (req, res) => {
//     const { kpi_name, a_name, b_name, username, a_value, b_value, type, timestamp } = req.body;
//     db.query("INSERT INTO kpi_data (kpi_name, a_name, b_name, username, a_value, b_value, type, timestamp) VALUES(?, ?, ?, ?, ?, ?, ?,?)",
//         [kpi_name, a_name, b_name, username, a_value, b_value, type, timestamp],
//         (err, result) => {
//             if (err) {
//                 res.status(400).send(err);
//             } else {
//                 res.send("data inserted")
//             }
//         })
// }

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
            res.send(result);
        }
    });
};

exports.getDetail = (req, res) => {
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
            res.send(result);
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