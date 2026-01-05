import { pool } from '../../config/db'

export async function getTestCasesByUser(userId: number) {
    const result = await pool.query(
      `SELECT * FROM test_cases WHERE assigned_to = $1 OR created_by = $1`,
      [userId]
  );
  return result.rows;
}

export async function addTestCase(title: string, description: string, expected_result: string, project_id: number, group_id:number, userId: number) {
  console.log("addTestCase():", { title, description, expected_result, project_id, group_id });

  const result = await pool.query(
    `INSERT INTO test_cases (title, description, expected_result, project_id, group_id, created_by, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'draft')
    RETURNING *`,
    [title, description, expected_result, project_id, group_id, userId]
  );

  return result.rows[0];
}

export async function editTestCase(id: number, updates: any) {

  const allowedFields = ["title", "description", "expected_result", "project_id", "group_id", "status"];
  const fields = Object.keys(updates).filter(f => allowedFields.includes(f));

  if (fields.length === 0) {
    return await getTestCase(id);
  }

  const values = fields.map(f => updates[f]);
  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(", ");

  try {
    const result = await pool.query(
      `UPDATE test_cases SET ${setClause}, updated_at=NOW() WHERE id=$${fields.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  } catch (err) {
    console.error("editTestCase error:", err);
    throw err;
  }
}


export async function getAllTestCases() {
  const result = await pool.query(
    `SELECT * FROM test_cases`
  );
  return result.rows;
}

export async function getTestCase(id: number) {
  const result = await pool.query(
    `SELECT * FROM test_cases WHERE id = $1`,
    [id]
  );

  return result.rows[0] || null;
}

export async function deleteTestCase(id: number) {
  const result = await pool.query(
    "DELETE FROM test_cases WHERE id = $1", 
    [id]
  );
  return result.rows[0];
}

export async function GetAllTestCasesFromProject(project_id: number) {
  const result = await pool.query(
    `SELECT 
      tc.*,
      g.name AS group_name
    FROM test_cases tc
    LEFT JOIN test_case_groups g ON tc.group_id = g.id
    WHERE tc.project_id = $1
    ORDER BY tc.id;
`,
    //`SELECT * FROM test_cases WHERE project_id = $1`,
    [project_id]
  );
  return result.rows;
}
