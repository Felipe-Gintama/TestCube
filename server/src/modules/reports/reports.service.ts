import { pool } from "../../config/db";

export async function getRunSummary(runId: number) {
  const { rows } = await pool.query(
    `
    SELECT trc.status, COUNT(*)::int AS count
    FROM test_run_cases trc
    WHERE trc.run_id = $1
    GROUP BY trc.status
    `,
    [runId]
  );
  return rows;
}

export async function getRunByUser(runId: number) {
  const { rows } = await pool.query(
    `
    SELECT COALESCE(u.name, 'unassigned') AS "user",
           COUNT(*)::int AS count
    FROM test_run_cases trc
    LEFT JOIN users u ON u.id = trc.assigned_to
    WHERE trc.run_id = $1
    GROUP BY u.name
    ORDER BY count DESC
    `,
    [runId]
  );
  return rows;
}

export async function getRunTests(runId: number) {
  const { rows } = await pool.query(
    `
    SELECT tc.title,
           trc.status,
           COALESCE(u.name, 'Unassigned') AS assigned_to
    FROM test_run_cases trc
    JOIN test_cases tc ON tc.id = trc.test_case_id
    LEFT JOIN users u ON u.id = trc.assigned_to
    WHERE trc.run_id = $1
    ORDER BY tc.title
    `,
    [runId]
  );
  return rows;
}
