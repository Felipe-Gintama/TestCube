import { pool } from "../../config/db";

export async function StartTestRun(
  releaseId: number,
  planId: number
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
      [planId, releaseId]
    );

    const runId = runRes.rows[0].id;

    await client.query(
      `
      INSERT INTO test_run_cases (run_id, test_case_id)
      SELECT $1, test_case_id
      FROM test_plan_cases
      WHERE test_plan_id = $2
      `,
      [runId, planId]
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

export async function AddUserToRun(runId: number, userId: number) {
  const result = await pool.query(
    `INSERT INTO test_run_users (test_run_id, user_id) VALUES ($1, $2) RETURNING *`,
    [runId, userId]
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
    ORDER BY tr.id`,
    [userId]
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
    ORDER BY tr.id`
  );
  return result.rows;
}
