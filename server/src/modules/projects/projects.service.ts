import { pool } from "../../config/db";

export async function GetAllUserProjects(userId: number) {
  const result = await pool.query(
    `SELECT * FROM projects WHERE created_by = $1`,
    [userId],
  );

  return result.rows;
}

export async function GetAllUsersFromProject(projectId: number) {
  const result = await pool.query(
    `SELECT u.id, u.name
      FROM users u
      JOIN project_members pm ON pm.user_id = u.id
      WHERE pm.project_id = $1
      ORDER BY u.id`,
    [projectId],
  );

  return result.rows;
}

export async function CreateNewProject(
  name: string,
  desc: string,
  userId: number,
  repo?: string,
) {
  const result = await pool.query(
    `INSERT INTO projects (name, description, created_by, github_repo)
        VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, desc, userId, repo ?? null],
  );

  return result.rows[0];
}

export async function EditProject(id: number, updates: any) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);
  const setClause = fields.map((f, i) => `${f}=$${i + 1}`).join(", ");

  const result = await pool.query(
    `UPDATE projects 
        SET ${setClause} 
        WHERE id=$${fields.length + 1} RETURNING *`,
    [...values, id],
  );

  return result.rows[0];
}

// export async function DeleteProject(project_id: number) {
//   const result = await pool.query(
//     `DELETE FROM projects WHERE id = $1 RETURNING *`,
//     [project_id],
//   );

//   return result.rows[0];
// }

export async function DeleteProject(projectId: number) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(`DELETE FROM project_members WHERE project_id = $1`, [
      projectId,
    ]);

    const res = await client.query(
      `DELETE FROM projects WHERE id = $1 RETURNING *`,
      [projectId],
    );

    await client.query("COMMIT");

    return res.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function GetMembersOfProject(projectId: number) {
  const result = await pool.query(
    `SELECT * FROM project_members
        WHERE project_id = $1`,
    [projectId],
  );

  return result.rows;
}

export async function AddMemeberToProject(projectId: number, userId: number) {
  const result = await pool.query(
    `INSERT INTO project_members (project_id, user_id) 
        VALUES ($1, $2) RETURNING *`,
    [projectId, userId],
  );

  return result.rows[0];
}

export async function DeleteMemberProject(projectId: number, userId: number) {
  const result = await pool.query(
    `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 RETURNING *`,
    [projectId, userId],
  );

  return result.rows[0];
}

export async function updateGithubRepo(projectId: number, repo: string | null) {
  const result = await pool.query(
    `UPDATE projects
    SET github_repo = $1
    WHERE id = $2
    RETURNING id, name, github_repo`,
    [repo, projectId],
  );

  return result.rows[0];
}
