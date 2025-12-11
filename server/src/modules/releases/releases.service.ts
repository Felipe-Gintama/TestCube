import { pool } from '../../config/db'

export async function GetAllReleasesFromProject(projectId: number) {

    const result = await pool.query(
        `SELECT *
        FROM releases 
        WHERE project_id = $1
        ORDER BY created_at DESC`,
        [projectId]
    );

    return result.rows;
}

export async function createRelease(projectId: number, version: string, description?: string | null, released_at?: string | null) {
    const result = await pool.query(
    `INSERT INTO releases (project_id, version, description, released_at)
    VALUES ($1, $2, $3, $4)
    RETURNING *`,
    [projectId, version, description, released_at]
  );

  return result.rows[0];
}

export async function deleteReleaseById(releaseId: number) {
    const result = await pool.query(
    `DELETE FROM releases
    WHERE id = $1
    RETURNING *
    `, [releaseId]
  );

  return result.rows[0];
}
