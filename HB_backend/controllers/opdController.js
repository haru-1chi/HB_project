const crudFactory = require("../utils/crudFactory");
const db = require("../mysql.js");
const util = require("util");
const query = util.promisify(db.query).bind(db);

async function ensureParent(table, nameField, idOrName, extraFields = {}) {
  if (!isNaN(idOrName)) return Number(idOrName);

  const fieldNames = [nameField, ...Object.keys(extraFields)];
  const placeholders = fieldNames.map(() => "?").join(", ");
  const sql = `
    INSERT INTO ${table} (${fieldNames.join(", ")})
    VALUES (${placeholders})
  `;

  const values = [idOrName, ...Object.values(extraFields)];

  const result = await query(sql, values);
  return result.insertId;
}

exports.missionGroupController = {
  ...crudFactory("mission_name", ["mission_name"]),

  list: async (req, res) => {
    const includeDeleted = req.query.includeDeleted === "true";
    const sql = `
      SELECT id, mission_name, deleted_at
      FROM mission_name
      ${includeDeleted ? "" : "WHERE deleted_at IS NULL"}
      ORDER BY mission_name ASC
    `;
    const rows = await query(sql);
    res.json(rows);
  }
};

exports.workGroupController = {
  ...crudFactory("work_name", ["work_name", "mission_id"]),
  create: async (req, res) => {
    const items = req.body;

    for (const item of items) {
      item.mission_id = await ensureParent(
        "mission_name",
        "mission_name",
        item.mission_id
      );
    }

    // call factory normally
    return crudFactory("work_name", ["work_name", "mission_id"]).create(
      { ...req, body: items },
      res
    );
  },
  update: async (req, res) => {
    try {
      const items = req.body;

      for (const item of items) {
        // 1️⃣ ensure mission exists
        item.mission_id = await ensureParent(
          "mission_name",
          "mission_name",
          item.mission_id
        );
      }

      // 2️⃣ update normally
      return crudFactory("work_name", ["work_name", "mission_id"])
        .update({ ...req, body: items }, res);

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
  },
  list: async (req, res) => {
    const includeDeleted = req.query.includeDeleted === "true";

    const sql = `
      SELECT 
        w.id,
        w.mission_id,
        w.work_name,
        m.mission_name,
        w.deleted_at
      FROM work_name w
      LEFT JOIN mission_name m ON w.mission_id = m.id
      ${includeDeleted ? "" : "WHERE w.deleted_at IS NULL"}
      ORDER BY m.mission_name, w.work_name
    `;

    const rows = await query(sql);
    res.json(rows);
  }
};


exports.opdController = {
  ...crudFactory("opd_name", ["opd_name", "work_id"]),
  create: async (req, res) => {
    try {
      const items = req.body;

      for (const item of items) {
        // 1️⃣ Ensure mission exists / insert if new
        item.mission_id = await ensureParent(
          "mission_name",
          "mission_name",
          item.mission_id
        );

        // 2️⃣ Ensure work exists / insert if new, with mission_id
        item.work_id = await ensureParent(
          "work_name",
          "work_name",
          item.work_id,
          { mission_id: item.mission_id } // 🔥 add parent
        );

        // 3️⃣ Insert OPD
        await query(
          `INSERT INTO opd_name (opd_name, work_id) VALUES (?, ?)`,
          [item.opd_name, item.work_id]
        );
      }

      return res.json({
        success: true,
        message: "OPD created successfully"
      });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ success: false, message: "Internal error" });
    }
  },
  update: async (req, res) => {
    try {
      const items = req.body;

      for (const item of items) {

        // 1️⃣ mission (insert if needed)
        item.mission_id = await ensureParent(
          "mission_name",
          "mission_name",
          item.mission_id
        );

        // 2️⃣ work (insert if needed)
        item.work_id = await ensureParent(
          "work_name",
          "work_name",
          item.work_id,
          { mission_id: item.mission_id }  // parent FK
        );
      }

      // 3️⃣ update normally
      return crudFactory("opd_name", ["opd_name", "work_id"])
        .update({ ...req, body: items }, res);

    } catch (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
  },
  list: async (req, res) => {
    const includeDeleted = req.query.includeDeleted === "true";

    const sql = `
      SELECT 
        o.id,
        w.mission_id,
        o.work_id,
        o.opd_name,
        w.work_name,
        m.mission_name,
        o.deleted_at
      FROM opd_name o
      LEFT JOIN work_name w ON o.work_id = w.id
      LEFT JOIN mission_name m ON w.mission_id = m.id
      ${includeDeleted ? "" : "WHERE o.deleted_at IS NULL"}
      ORDER BY m.mission_name, w.work_name, o.opd_name
    `;

    const rows = await query(sql);
    res.json(rows);
  }
};

exports.getWorkOPDGroup = async (req, res) => {
  try {
    const sql = `
      SELECT 
        w.id AS work_id, w.work_name,
        o.id AS opd_id, o.opd_name
      FROM work_name w
      LEFT JOIN opd_name o ON o.work_id = w.id AND o.deleted_at IS NULL
      WHERE w.deleted_at IS NULL
      ORDER BY w.work_name, o.opd_name
    `;

    const rows = await query(sql);

    // Group by Work
    const result = [];

    rows.forEach(row => {
      // skip rows with null opd_id
      if (!row.opd_id) return;

      let work = result.find(x => x.work_id === row.work_id);
      if (!work) {
        work = {
          label: row.work_name,
          work_id: row.work_id,
          items: []
        };
        result.push(work);
      }

      work.items.push({
        label: row.opd_name,
        value: row.opd_id
      });
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
