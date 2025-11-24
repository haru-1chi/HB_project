const crudFactory = require("../utils/crudFactory");
const db = require("../mysql.js");
const util = require("util");
const query = util.promisify(db.query).bind(db);
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

