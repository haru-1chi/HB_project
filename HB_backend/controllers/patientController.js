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
    const result = await connection.execute(
      `SELECT 
    COUNT(o.OPD_NO) AS all_user,
    SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NULL THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NOT NULL THEN 1 ELSE 0 END) AS completed
FROM OPDS o
JOIN PLACES pl ON pl.PLACECODE = o.PLA_PLACECODE
WHERE o.opd_date = TRUNC(SYSDATE)
`
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

async function stateOPDS(req, res) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT 
    o.PLA_PLACECODE,
    pl.fullplace AS OPD_name,
    COUNT(o.OPD_NO) AS all_user,
    SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NULL THEN 1 ELSE 0 END) AS pending,
    SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NOT NULL THEN 1 ELSE 0 END) AS completed
FROM OPDS o
JOIN PLACES pl ON pl.PLACECODE = o.PLA_PLACECODE
WHERE o.opd_date = TRUNC(SYSDATE)

GROUP BY o.PLA_PLACECODE, pl.fullplace
ORDER BY all_user DESC`
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

module.exports = { fetchPatientState, summary, stateOPDS };

