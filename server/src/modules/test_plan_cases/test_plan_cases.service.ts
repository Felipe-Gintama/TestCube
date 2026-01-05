import { pool } from '../../config/db'

export async function GetAllTestCasesFromPlan(planId: number) {
  const result = await pool.query(
    // `SELECT 
    //   tpc.id AS plan_case_id,
    //   tc.id AS test_case_id,
    //   tc.title,
    //   tc.description,
    //   tc.expected_result,
    //   tc.group_id,
    //   tpc.position
    // FROM test_plan_cases tpc
    // JOIN test_cases tc ON tpc.test_case_id = tc.id
    // WHERE tpc.test_plan_id = $1
    // ORDER BY tpc.position ASC`,
    `SELECT 
      tpc.id AS plan_case_id,
      tc.id AS test_case_id,
      tc.title,
      tc.description,
      tc.expected_result,
      tc.group_id,
      g.name AS group_name,
      tpc.position
    FROM test_plan_cases tpc
    JOIN test_cases tc ON tpc.test_case_id = tc.id
    LEFT JOIN test_case_groups g ON g.id = tc.group_id
    WHERE tpc.test_plan_id = $1
    ORDER BY tpc.position ASC`,
    [planId]
  );
  return result.rows;
  // Normalizacja pod frontend
  // return result.rows.map(row => ({
  //   id: row.plan_case_id,
  //   test_case_id: row.test_case_id,
  //   title: row.title,
  //   description: row.description,
  //   expected_result: row.expected_result,
  //   group_id: row.group_id,
  //   position: Number(row.position)
  // }));
}

export async function AddTestCaseToPlan(testPlanId: number, testCaseId: number) {

  const posRes = await pool.query(
    `SELECT COALESCE(MAX(position), 0) AS last FROM test_plan_cases WHERE test_plan_id = $1`,
    [testPlanId]
  );

  const newPosition = posRes.rows[0].last + 1;

  const result = await pool.query(
    `INSERT INTO test_plan_cases (test_plan_id, test_case_id, position)
       VALUES ($1, $2, $3)
       RETURNING *`,
    [testPlanId, testCaseId, newPosition]
  );

  return result.rows[0];
}

export async function RemoveTestFromPlan(testPlanId: number, testCaseId: number) {
  const { rows } = await pool.query(
    `SELECT position FROM test_plan_cases 
     WHERE test_plan_id = $1 AND id = $2`,
    [testPlanId, testCaseId]
  );

  if (rows.length === 0) return null;

  const removedPosition = rows[0].position;

  const deleted = await pool.query(
    `DELETE FROM test_plan_cases
     WHERE test_plan_id = $1 AND id = $2
     RETURNING *`,
    [testPlanId, testCaseId]
  );

  await pool.query(
    `UPDATE test_plan_cases
     SET position = position - 1
     WHERE test_plan_id = $1 AND position > $2`,
    [testPlanId, removedPosition]
  );

  return deleted.rows[0];
}