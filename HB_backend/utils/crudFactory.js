const db = require("../mysql.js");
const util = require("util");
const query = util.promisify(db.query).bind(db);

const crudFactory = (tableName, fields) => {

    return {

        create: async (req, res) => {
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
        INSERT INTO ${tableName}
        (${fields.join(", ")}, created_by)
        VALUES ?
      `;

            const result = await query(sql, [values]);

            res.json({
                success: true,
                message: `Inserted ${result.affectedRows} record(s) into ${tableName}`
            });
        },

        update: async (req, res) => {
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

            await query(sql);

            res.json({
                success: true,
                message: `Updated ${dataArray.length} record(s) in ${tableName}`
            });
        },

        delete: async (req, res) => {
            const { id } = req.params;

            const sql = `
        UPDATE ${tableName}
        SET deleted_at = NOW()
        WHERE id = ? AND deleted_at IS NULL
      `;

            const result = await query(sql, [id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "Record not found or already deleted" });
            }

            res.json({
                success: true,
                message: `Soft deleted record ID ${id} in ${tableName}`
            });
        },
    }
}

module.exports = crudFactory;
