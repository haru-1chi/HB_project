// controllers/patientController.js
const { getConnection } = require('../db');

async function fetchPatientState(req, res) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT 
        CASE o.ER_STATUS
          WHEN '1' THEN 'คนไข้ที่ยังไม่ได้ตรวจ'
          WHEN '2' THEN 'ตรวจแล้วรอผล/สังเกตุอาการ'
          WHEN '3' THEN 'ออกจาก ER แล้ว'
        END AS Title,
        COUNT(o.ER_STATUS) AS Score
      FROM OPDS o, PATIENTS p
      WHERE o.PAT_RUN_HN = p.RUN_HN
        AND o.PAT_YEAR_HN = p.YEAR_HN
        AND o.PLA_PLACECODE = '042'
        AND (24 * (SYSDATE - TO_DATE(TO_CHAR(o.opd_date, 'DDMMYYYY') || ' ' || TO_CHAR(o.opd_time, 'HH24:MI'), 'DDMMYYYY HH24:MI'))) <= 8
        AND o.ER_STATUS IN ('1', '2', '3')
      GROUP BY o.ER_STATUS
      ORDER BY o.ER_STATUS`
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function summary(req, res) {
  let connection;
  try {
    connection = await getConnection();

    const { opdNames } = req.query;

    let opdFilter = "";
    let queryParams = [];

    if (opdNames) {
      const namesArray = opdNames.split(",").map(name => name.trim());
      opdFilter = `AND pl.fullplace IN (${namesArray.map(() => ":name").join(", ")})`;
      queryParams = namesArray; // Bind each value separately
    }

    const query = `SELECT 
    COUNT(o.OPD_NO) AS all_user,
    SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NULL THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NOT NULL THEN 1 ELSE 0 END) AS completed,
    ROUND(AVG(
        CASE 
            WHEN o.FINISH_OPD_DATETIME IS NOT NULL 
            THEN (o.FINISH_OPD_DATETIME - o.REACH_OPD_DATETIME) * 24 * 60 
            ELSE NULL 
        END
    ), 2) AS avg_wait_time
FROM OPDS o
JOIN PLACES pl ON pl.PLACECODE = o.PLA_PLACECODE
WHERE o.opd_date = TRUNC(SYSDATE) ${opdFilter}
`;
    const result = await connection.execute(query, queryParams, { autoCommit: true });
    res.json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

async function stateOPDS(req, res) {
  let connection;
  try {
    connection = await getConnection();

    const { sortField = "all_user", sortOrder = "DESC", opdNames } = req.query;

    let opdFilter = "";
    let queryParams = [];

    if (opdNames) {
      const namesArray = opdNames.split(",").map(name => name.trim());
      opdFilter = `AND pl.fullplace IN (${namesArray.map(() => ":name").join(", ")})`;
      queryParams = namesArray; // Bind each value separately
    }

    const query = `
      SELECT 
        o.PLA_PLACECODE,
        pl.fullplace AS OPD_name,
        COUNT(o.OPD_NO) AS all_user,
        SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NULL THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NOT NULL THEN 1 ELSE 0 END) AS completed,
        ROUND(AVG(
            CASE 
                WHEN o.RX_OPD_DATETIME IS NOT NULL 
                THEN (o.RX_OPD_DATETIME - o.REACH_OPD_DATETIME) * 24 * 60 
                ELSE NULL 
            END
        ), 2) AS avg_wait_screen,
				ROUND(AVG(
            CASE 
                WHEN od.ALREADY_RECEIVE_DRUG_DATE IS NOT NULL 
                THEN (od.ALREADY_RECEIVE_DRUG_DATE - od.DATETIME_IN_SECOND) * 24 * 60 
                ELSE NULL 
            END
        ), 2) AS avg_wait_drug,
				ROUND(AVG(
            CASE 
                WHEN o.FINISH_OPD_DATETIME IS NOT NULL 
                THEN (o.FINISH_OPD_DATETIME - o.REACH_OPD_DATETIME) * 24 * 60 
                ELSE NULL 
            END
        ), 2) AS avg_wait_all
      FROM OPDS o
      JOIN PLACES pl ON pl.PLACECODE = o.PLA_PLACECODE
      JOIN OPD_FINANCE_HEADERS od ON od.opd_no = o.opd_no
      WHERE o.opd_date = TRUNC(SYSDATE) ${opdFilter}
      GROUP BY o.PLA_PLACECODE, pl.fullplace
      ORDER BY ${sortField} ${sortOrder}`;

    // Use executeMany() for correct binding
    const result = await connection.execute(query, queryParams, { autoCommit: true });

    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

module.exports = { fetchPatientState, summary, stateOPDS };

