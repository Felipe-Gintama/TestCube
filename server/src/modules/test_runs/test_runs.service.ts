import { pool } from "../../config/db";

export async function StartTestRun(
  releaseId: number,
  planId: number,
  //userId: number
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const runRes = await client.query(
      `
      INSERT INTO test_runs (test_plan_id, release_id)
      VALUES ($1, $2)
      RETURNING id
      `,
      [planId, releaseId],
    );

    const runId = runRes.rows[0].id;

    await client.query(
      `
      INSERT INTO test_run_cases (run_id, test_case_id)
      SELECT $1, test_case_id
      FROM test_plan_cases
      WHERE test_plan_id = $2
      `,
      [runId, planId],
    );

    await client.query("COMMIT");
    return runId;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function FinishRun(runId: number) {
  const result = await pool.query(
    `UPDATE test_runs
    SET
    status = 'FINISHED',
    finished_at = NOW()
    WHERE id = $1
    RETURNING *`,
    [runId],
  );
  return result.rows[0];
}

export async function AddUserToRun(runId: number, userId: number) {
  const result = await pool.query(
    `INSERT INTO test_run_users (test_run_id, user_id) VALUES ($1, $2) RETURNING *`,
    [runId, userId],
  );
  return result.rows[0];
}

export async function GetRunsAssignedToUser(userId: number) {
  const result = await pool.query(
    `SELECT
      tr.id AS test_run_id,
      tr.version,
      tr.test_plan_id,
      tp.name AS plan_name,
      r.version AS release_version
    FROM test_runs tr
    JOIN test_plans tp ON tp.id = tr.test_plan_id
    JOIN release_test_plans rtp ON rtp.plan_id = tp.id
    JOIN releases r ON r.id = rtp.release_id
    JOIN test_run_users tru ON tru.test_run_id = tr.id
    WHERE tru.user_id = $1
    AND tr.status = 'IN_PROGRESS'
    ORDER BY tr.id`,
    [userId],
  );
  return result.rows;
}

export async function GetAllTestRuns() {
  const result = await pool.query(
    `SELECT
      tr.id AS test_run_id,
      tr.version,
      tr.test_plan_id,
      tp.name AS plan_name,
      r.version AS release_version
    FROM test_runs tr
    JOIN test_plans tp ON tp.id = tr.test_plan_id
    JOIN release_test_plans rtp ON rtp.plan_id = tp.id
    JOIN releases r ON r.id = rtp.release_id
    WHERE tr.status = 'IN_PROGRESS'
    ORDER BY tr.id
    `,
  );
  return result.rows;
}
export async function GetTestRuns(runId: number) {
  const result = await pool.query(
    `SELECT *
    FROM test_runs WHERE id = $1
    `,
    [runId],
  );
  return result.rows;
}

export async function AssignUserToTests(
  userId: number,
  runId: number,
  testIds: number[],
) {
  const result = await pool.query(
    `UPDATE test_run_cases
  SET assigned_to = $1
  WHERE run_id = $2
  AND test_case_id = ANY($3::int[]);  `,
    [userId, runId, testIds],
  );
  return result.rows;
}

export async function RemoveAssignment(runId: number, testIds: number[]) {
  const result = await pool.query(
    `
    UPDATE test_run_cases
    SET assigned_to = null
    WHERE run_id = $1
    AND test_case_id = ANY($2::int[]);  
    `,
    [runId, testIds],
  );
  return result.rows;
}

export async function FinishTestCase(
  status: string,
  comment: string,
  runId: number,
  testId: number,
) {
  const result = await pool.query(
    `
    UPDATE test_run_cases
    SET status = $1, executed_at = now(), comment = $2
    WHERE run_id = $3
    AND test_case_id = $4
    RETURNING *
    `,
    [status, comment, runId, testId],
  );
  return result.rows[0];
}

//------Dashboard page API
export type DashboardRun = {
  id: number;
  ok: number;
  nok: number;
  blocked: number;
  untested: number;
  total: number;
  progress: number;
};

export async function getActiveRunsDashboard(): Promise<DashboardRun[]> {
  const { rows } = await pool.query(`
    SELECT
        tr.id,
        COUNT(trc.id) AS total,
        COUNT(*) FILTER (WHERE trc.status = 'OK') AS ok,
        COUNT(*) FILTER (WHERE trc.status = 'NOK') AS nok,
        COUNT(*) FILTER (WHERE trc.status = 'BLOCKED') AS blocked,
        COUNT(*) FILTER (WHERE trc.status = 'untested') AS untested
      FROM test_runs tr
      LEFT JOIN test_run_cases trc ON trc.run_id = tr.id
      WHERE tr.status = 'IN_PROGRESS'
      GROUP BY tr.id
  `);

  return rows.map((r) => {
    const finished = Number(r.ok) + Number(r.nok) + Number(r.blocked);

    const total = Number(r.total);

    return {
      id: r.id,
      name: r.name,
      ok: Number(r.ok),
      nok: Number(r.nok),
      blocked: Number(r.blocked),
      untested: Number(r.untested),
      total,
      progress: total === 0 ? 0 : Math.round((finished / total) * 100),
    };
  });
}
