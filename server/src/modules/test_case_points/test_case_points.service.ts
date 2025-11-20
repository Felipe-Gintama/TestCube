import { pool } from '../../config/db'

export async function AddTestCasePoint(test_case_id: number, description: string, position: number) {
    const result = await pool.query(
    `INSERT INTO test_case_points (test_case_id, description, position)
    VALUES ($1, $2, $3) RETURNING * `,
    [test_case_id, description, position]
  );
  return result.rows[0];
}

export async function GetTestCasePoints(test_case_id: number) {
    const result = await pool.query(
    `SELECT * FROM test_case_points WHERE test_case_id = $1 ORDER BY position ASC, id ASC`,
    [test_case_id]
  );
  return result.rows;
}

export async function GetTestCasePoint(id: number) {
    const result = await pool.query(
            "SELECT * FROM test_case_points WHERE id = $1",
            [id]
        );
  return result.rows;
}


export async function UpdateTestCasePoint(description: string, position: number, id: number) {
    const result = await pool.query(
    "UPDATE test_case_points SET description = $1, position = $2 WHERE id = $3 RETURNING *",
    [description, position, id]
  );
  return result.rows[0];
}

export async function DeleteTestCasePoint(id: number) {
    const result = await pool.query(
    "DELETE FROM test_case_points WHERE id = $1", 
    [id]
  );
  return result.rows[0];
}
