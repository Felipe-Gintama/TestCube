import { pool } from "../../config/db";

export async function GetTestPlans(releaseId: number) {
  const result = await pool.query(
    `SELECT tp.id, tp.name, tp.description, tp.created_by, tp.created_at
     FROM test_plans tp
     JOIN release_test_plans rtp ON tp.id = rtp.plan_id
     WHERE rtp.release_id = $1
     ORDER BY tp.created_at ASC`,
    [releaseId]
  );
  return result.rows;
}

export async function createTestPlan(
  releaseId: number,
  name: string,
  description: string,
  projectId: number,
  createdBy?: number | null
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const planRes = await client.query(
      `INSERT INTO test_plans (name, description, project_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description, projectId, createdBy]
    );

    const newPlan = planRes.rows[0];

    await client.query(
      `INSERT INTO release_test_plans (release_id, plan_id)
       VALUES ($1, $2)`,
      [releaseId, newPlan.id]
    );

    await client.query("COMMIT");

    return newPlan;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getReleaseById(releaseId: number) {
  const result = await pool.query(`SELECT * FROM releases WHERE id = $1`, [
    releaseId,
  ]);
  return result.rows[0];
}

export async function cloneTestPlan(planId: number, newReleaseId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const planRes = await client.query(
      `SELECT * FROM test_plans WHERE id = $1`,
      [planId]
    );
    if (planRes.rows.length === 0) throw new Error("Test plan not found");
    const plan = planRes.rows[0];

    const insertPlan = await client.query(
      `INSERT INTO test_plans (name, description, project_id, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        plan.name + " (Copy)",
        plan.description,
        plan.project_id,
        plan.created_by,
      ]
    );

    const newPlan = insertPlan.rows[0];

    await client.query(
      `INSERT INTO release_test_plans (release_id, plan_id)
       VALUES ($1, $2)`,
      [newReleaseId, newPlan.id]
    );

    const testCases = await client.query(
      `SELECT test_case_id FROM test_plan_cases WHERE test_plan_id = $1`,
      [planId]
    );
    for (const row of testCases.rows) {
      await client.query(
        `INSERT INTO test_plan_cases (test_plan_id, test_case_id)
         VALUES ($1, $2)`,
        [newPlan.id, row.test_case_id]
      );
    }

    await client.query("COMMIT");

    return { ...newPlan, testCases: testCases.rows.map((r) => r.test_case_id) };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function GetTestPlansByProject(projectId: number) {
  const result = await pool.query(
    `SELECT tp.id, tp.name, tp.description, tp.created_by, tp.created_at, r.id AS release_id, r.version AS release_version
     FROM test_plans tp
     JOIN release_test_plans rtp ON tp.id = rtp.plan_id
     JOIN releases r ON rtp.release_id = r.id
     WHERE r.project_id = $1
     ORDER BY r.created_at ASC, tp.created_at ASC`,
    [projectId]
  );
  return result.rows;
}

export async function deleteTestPlan(planId: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM release_test_plans WHERE plan_id = $1`, [
      planId,
    ]);

    await client.query(`DELETE FROM test_plan_cases WHERE test_plan_id = $1`, [
      planId,
    ]);

    const result = await client.query(
      `DELETE FROM test_plans WHERE id = $1 RETURNING id`,
      [planId]
    );

    await client.query("COMMIT");

    return (result.rowCount ?? 0) > 0;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("deleteTestPlan error:", err);
    throw err;
  } finally {
    client.release();
  }
}

export async function renameTestPlanService(planId: number, name: string) {
  const result = await pool.query(
    `
    UPDATE test_plans
    SET name = $1
    WHERE id = $2
    RETURNING id, name
    `,
    [name, planId]
  );

  return result;
}
