// controllers/patientController.js
const { getConnection } = require('../db');

async function summary(req, res) {
  const { opdNames } = req.query;
  let connection;

  try {
    connection = await getConnection();

    const bindParams = {};
    let opdFilter = "";

    if (opdNames) {
      const namesArray = opdNames.split(",").map((n) => n.trim());
      const bindPlaceholders = namesArray.map((_, i) => `:name${i}`);
      opdFilter = `AND pl.fullplace IN (${bindPlaceholders.join(", ")})`;

      // create key-value pairs for each bind
      namesArray.forEach((name, i) => {
        bindParams[`name${i}`] = name;
      });
    }
    const query = `SELECT 
     COUNT(o.OPD_NO) AS all_user,
      SUM(
  CASE 
    WHEN TO_CHAR(o.OPD_TIME, 'HH24:MI:SS') != '00:00:00' AND o.FINISH_OPD_DATETIME IS NULL 
    THEN 1 
    ELSE 0 
  END
) AS WAIT_PTS,
 	  SUM(CASE WHEN TO_CHAR(o.OPD_TIME, 'HH24:MI:SS') = '00:00:00' THEN 1 ELSE 0 END ) AS NOSHOW_PTS,
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
    const result = await connection.execute(query, bindParams, {
      outFormat: connection.OUT_FORMAT_OBJECT,
    });

    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
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
         COUNT(DISTINCT o.OPD_NO) AS all_user,
	SUM( CASE WHEN TO_CHAR( o.OPD_TIME, 'HH24:MI:SS' ) != '00:00:00' AND o.FINISH_OPD_DATETIME IS NULL THEN 1 ELSE 0 END ) AS WAIT_PTS,
	SUM( CASE WHEN TO_CHAR( o.OPD_TIME, 'HH24:MI:SS' ) = '00:00:00' THEN 1 ELSE 0 END ) AS NOSHOW_PTS,
        SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NULL THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN o.FINISH_OPD_DATETIME IS NOT NULL THEN 1 ELSE 0 END) AS completed,
        ROUND(AVG(
            CASE 
                WHEN o.RX_OPD_DATETIME IS NOT NULL 
                THEN ABS((o.RX_OPD_DATETIME - o.REACH_OPD_DATETIME) * 24 * 60) 
                ELSE NULL 
            END
        ), 2) AS avg_wait_screen,
        ROUND(AVG(
            CASE 
                WHEN od.ALREADY_RECEIVE_DRUG_DATE IS NOT NULL 
                THEN ABS((od.ALREADY_RECEIVE_DRUG_DATE - od.DATE_AND_TIME) * 24 * 60) 
                ELSE NULL 
            END
        ), 2) AS avg_wait_drug,
ROUND(
  AVG(
    CASE
      WHEN od.ALREADY_RECEIVE_DRUG_DATE IS NOT NULL THEN
        ABS((od.ALREADY_RECEIVE_DRUG_DATE - o.REACH_OPD_DATETIME) * 24 * 60)
      WHEN o.FINISH_OPD_DATETIME IS NOT NULL THEN
        ABS((o.FINISH_OPD_DATETIME - o.REACH_OPD_DATETIME) * 24 * 60)
      ELSE NULL
    END
  ), 2
) AS avg_wait_all
     FROM
				OPDS o
				JOIN PLACES pl ON pl.PLACECODE = o.PLA_PLACECODE
				LEFT JOIN (
				SELECT
					* 
				FROM
					(
					SELECT
						od.*,
						ROW_NUMBER ( ) OVER ( PARTITION BY opd_no ORDER BY ALREADY_RECEIVE_DRUG_DATE DESC ) AS rn 
					FROM
						OPD_FINANCE_HEADERS od 
					WHERE
						od.ALREADY_RECEIVE_DRUG_DATE IS NOT NULL 
					) 
				WHERE
					rn = 1 
				) od ON od.opd_no = o.opd_no 
			WHERE
				o.opd_date = TRUNC( SYSDATE ) ${opdFilter}
      GROUP BY o.PLA_PLACECODE, pl.fullplace
      ORDER BY ${sortField} ${sortOrder}`;

    const result = await connection.execute(query, queryParams, { autoCommit: true });

    res.json(result.rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("Error closing connection:", closeErr);
      }
    }
  }
}

module.exports = { summary, stateOPDS };

