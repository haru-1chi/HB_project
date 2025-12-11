const db = require("../mysql.js");;

const crudFactory = (tableName, fields) => {

    return {

        create: async (req, res) => {
            try {
                const dataArray = req.body;
                const userName = req.user?.name || "Unknown User";

                if (!Array.isArray(dataArray) || dataArray.length === 0) {
                    return res.status(400).json({ success: false, message: "Data must be a non-empty array" });
                }

                const values = dataArray.map(item => [
                    ...fields.map(f => item[f]),
                    userName
                ]);

                const sql = `
          INSERT INTO ${tableName} (${fields.join(", ")}, created_by)
          VALUES ?
        `;

                const [result] = await db.query(sql, [values]);

                res.json({
                    success: true,
                    message: `Inserted ${result.affectedRows} record(s) into ${tableName}`
                });

            } catch (err) {
                console.error("❌ Error creating records:", err);
                res.status(500).json({ success: false, message: err.message });
            }
        },

        update: async (req, res) => {
            try {
                const dataArray = req.body;
                const userName = req.user?.name || "Unknown User";

                if (!Array.isArray(dataArray) || dataArray.length === 0) {
                    return res.status(400).json({ success: false, message: "Data must be a non-empty array" });
                }

                const ids = [];
                const cases = {};
                fields.forEach(f => (cases[f] = []));

                dataArray.forEach(item => {
                    ids.push(item.id);
                    fields.forEach(f => {
                        cases[f].push(`WHEN ${item.id} THEN ${db.escape(item[f] ?? null)}`);
                    });
                });

                const sql = `
          UPDATE ${tableName}
          SET
            ${fields.map(f => `${f} = CASE id ${cases[f].join(" ")} END`).join(", ")},
            updated_by = ${db.escape(userName)},
            updated_at = NOW()
          WHERE id IN (${ids.join(",")})
        `;

                const [result] = await db.query(sql);

                res.json({
                    success: true,
                    message: `Updated ${result.affectedRows} record(s) in ${tableName}`
                });

            } catch (err) {
                console.error("❌ Error updating records:", err);
                res.status(500).json({ success: false, message: err.message });
            }
        },

        delete: async (req, res) => {
            try {
                const { id } = req.params;
                if (!id) {
                    return res.status(400).json({ success: false, message: "ID is required" });
                }

                const sql = `
          UPDATE ${tableName}
          SET deleted_at = NOW()
          WHERE id = ? AND deleted_at IS NULL
        `;

                const [result] = await db.query(sql, [id]);

                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: "Record not found or already deleted" });
                }

                res.json({
                    success: true,
                    message: `Soft deleted record ID ${id} in ${tableName}`
                });

            } catch (err) {
                console.error("❌ Error deleting record:", err);
                res.status(500).json({ success: false, message: err.message });
            }
        },

    }
};

module.exports = crudFactory;