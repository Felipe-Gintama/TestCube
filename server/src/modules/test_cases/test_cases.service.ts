import { pool } from '../../config/db'

export async function getTestCasesByUser(userId: number) {
    const result = await pool.query(
      `SELECT * FROM test_cases WHERE assigned_to = $1 OR created_by = $1`,
      [userId]
  );
  return result.rows;
}

export async function addTestCase(title: string, description: string, expected_result: string, project_id: number, userId: number) {
  console.log("addTestCase():", { title, description, expected_result, project_id });

  const result = await pool.query(
    `INSERT INTO test_cases (title, description, expected_result, project_id, created_by, status)
     VALUES ($1, $2, $3, $4, $5, 'draft')
     RETURNING *`,
    [title, description, expected_result, project_id, userId]
  );

  return result.rows[0];
}

export async function editTestCase(id: number, updates: any) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(", ");

  const result = await pool.query(
      `UPDATE test_cases SET ${setClause}, updated_at=NOW() WHERE project_id=$${fields.length + 1} RETURNING *`,
      [...values, id]
  );
  return result.rows[0];
}

export async function getAllTestCases() {
  const result = await pool.query(
    `SELECT * FROM test_cases`
  );
  return result.rows[0];
}
