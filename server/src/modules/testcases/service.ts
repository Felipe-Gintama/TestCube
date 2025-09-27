import { pool } from '../../config/db'

export async function getAllTestCases() {
  const result = await pool.query('SELECT id, title, description FROM testcases ORDER BY id')
  return result.rows
}
