const db = require('../mysql.js');
const util = require("util");

const query = util.promisify(db.query).bind(db);
const queryAsync = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) =>
            err ? reject(err) : resolve(results)
        );
    });

exports.createKPIDataQuality = async (req, res) => {
    const {
        kpi_id,
        a_value,
        b_value,
        issue_details,
        support_details,
        report_date,
        type
    } = req.body;
    const userName = req.user?.name || "Unknown User";
    try {
        // Validate required fields
        if (!kpi_id || !report_date || !type) {
            return res.status(400).json({
                success: false,
                message: "kpi_id, report_date and type are required",
            });
        }

        const sql = `
    INSERT INTO kpi_data 
    (kpi_name, a_value, b_value, issue_details, support_details, report_date, type, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;


        const values = [
            kpi_id,
            a_value || null,
            b_value || null,
            issue_details || null,
            support_details || null,
            report_date,
            type,
            userName
        ];

        const result = await queryAsync(sql, values);

        res.json({
            success: true,
            message: "✅ KPI Quality Data inserted successfully",
            insertedId: result.insertId,
        });

    } catch (error) {
        console.error("❌ Error inserting KPI Quality data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to insert KPI Quality data",
            error: error.message,
        });
    }
};

exports.updateKPIDataQuality = async (req, res) => {
    const { id } = req.params;
    const {
        kpi_id,
        a_value,
        b_value,
        issue_details,
        support_details,
        report_date,
        type
    } = req.body;

    const userName = req.user?.name || "Unknown User";

    try {
        // Validate required fields
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "ID is required for update",
            });
        }

        if (!kpi_id || !report_date || !type) {
            return res.status(400).json({
                success: false,
                message: "kpi_id, report_date and type are required",
            });
        }

        const sql = `
            UPDATE kpi_data
            SET
                kpi_name = ?,
                a_value = ?,
                b_value = ?,
                issue_details = ?,
                support_details = ?,
                report_date = ?,
                type = ?,
                updated_by = ?,
                updated_at = NOW()
            WHERE id = ?
        `;

        const values = [
            kpi_id,
            a_value || null,
            b_value || null,
            issue_details || null,
            support_details || null,
            report_date,
            type,
            userName,
            id
        ];

        const result = await queryAsync(sql, values);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "No KPI record found with this ID",
            });
        }

        res.json({
            success: true,
            message: "✅ KPI Quality Data updated successfully",
            updatedId: id,
        });

    } catch (error) {
        console.error("❌ Error updating KPI Quality data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update KPI Quality data",
            error: error.message,
        });
    }
};


const monthTH = [
    "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
    "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
    "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];


exports.getKPIDataQuality = async (req, res) => {
    try {
        const { kpi_name, type, since, until } = req.query;
        if (!kpi_name) {
            return res.json([]);
        }
        let sql = `
            SELECT 
                d.*,
                n.kpi_name AS kpi_label
            FROM kpi_data d
            LEFT JOIN kpi_name n ON d.kpi_name = n.id
            WHERE 1=1
        `;

        const params = [];

        if (kpi_name) {
            sql += ` AND d.kpi_name = ?`;
            params.push(kpi_name);
        }

        if (type != "รวม") {
            sql += ` AND d.type = ?`;
            params.push(type);
        }

        if (since && until) {
            sql += ` AND DATE(d.report_date) BETWEEN ? AND ?`;
            params.push(since, until);
        } else if (since) {
            sql += ` AND DATE(d.report_date) >= ?`;
            params.push(since);
        } else if (until) {
            sql += ` AND DATE(d.report_date) <= ?`;
            params.push(until);
        }

        sql += ` ORDER BY d.report_date ASC`;

        const result = await query(sql, params);

        // 🔥 Format TH date here
        const formatted = (Array.isArray(result) ? result : []).map((r) => {
            const d = new Date(r.report_date);
            const month = monthTH[d.getMonth()];
            const year = (d.getFullYear()).toString().slice(-2);
            return {
                ...r,
                report_date_formatted: `${month} ${year}`
            };
        });

        res.status(200).json(formatted);

    } catch (err) {
        console.error("❌ Error fetching KPI Quality data:", err);
        res.status(500).json([]);
    }
};


exports.deleteKPIDataQuality = async (req, res) => {
    const { id } = req.params; // /kpi-data-quality/:id

    try {
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Missing id parameter",
            });
        }

        const sql = `
            DELETE FROM kpi_data_quality
            WHERE id = ?
        `;

        const result = await queryAsync(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "No KPI Quality Data found with this ID",
            });
        }

        res.json({
            success: true,
            message: "🗑️ KPI Quality Data deleted successfully",
            deletedId: id,
        });

    } catch (error) {
        console.error("❌ Error deleting KPI Quality Data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete KPI Quality Data",
            error: error.message,
        });
    }
};