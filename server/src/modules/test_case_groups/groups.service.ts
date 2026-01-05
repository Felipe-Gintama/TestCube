import { pool } from "../../config/db";

export async function EditTestGroups(
  name: string,
  description: string,
  id: number
) {
  const result = await pool.query(
    `UPDATE test_case_groups 
        SET name = COALESCE($1, name), description = COALESCE($2, description) WHERE id = $3 RETURNING *`,
    [name, description, id]
  );

  return result.rows[0];
}

export async function CreateTestGroups(name: string, projectId: number) {
  const result = await pool.query(
    `INSERT INTO test_case_groups (name, project_id) VALUES ($1, $2) RETURNING *`,
    [name, projectId]
  );

  return result.rows[0];
}

export async function AddSubGroup(name: string, parentId: number) {
  const result = await pool.query(
    `INSERT INTO test_case_groups (name, parent_group_id) 
        VALUES ($1, $2) RETURNING *`,
    [name, parentId]
  );

  return result.rows[0];
}

export async function DeleteGroupWithTestCases(id: number) {
  const result = await pool.query(
    `DELETE FROM test_case_groups WHERE id = $1 RETURNING *`,
    [id]
  );

  return result.rows[0];
}

export async function DisplayAllTestCasesAndAssignedGroups(projectId: number) {
  const result = await pool.query(
    `SELECT 
            g.id AS group_id,
            g.name AS group_name,
            g.parent_group_id,
            c.id AS case_id,
            c.title AS case_title,
            c.status
        FROM test_case_groups g
        LEFT JOIN test_cases c ON g.id = c.group_id
        WHERE g.project_id = $1
        ORDER BY g.parent_group_id, g.id, c.id`,
    [projectId]
  );

  return result.rows;
}

export async function DisplayGroupTree(projectId: number) {
  const result = await pool.query(
    `WITH RECURSIVE group_tree AS (
            SELECT id, name, parent_group_id, project_id
            FROM test_case_groups
            WHERE parent_group_id IS NULL AND project_id = $1
            UNION ALL
            SELECT g.id, g.name, g.parent_group_id, g.project_id
            FROM test_case_groups g
            INNER JOIN group_tree gt ON g.parent_group_id = gt.id
        )
        SELECT * FROM group_tree`,
    [projectId]
  );

  return result.rows;
}

export async function DisplayCountOfTestCasesInEachGroup() {
  const result = await pool.query(
    `SELECT g.name, COUNT(c.id) AS total_cases
        FROM test_case_groups g
        LEFT JOIN test_cases c ON g.id = c.group_id
        GROUP BY g.name`
  );

  return result.rows;
}
export async function DisplayCountOfTestCasesInProject(projectId: number) {
  const result = await pool.query(
    `SELECT p.id AS project_id, p.name AS project_name,
        COUNT(c.id) AS total_test_cases
        FROM projects p
        LEFT JOIN test_cases c ON p.id = c.project_id
        WHERE p.id = $1
        GROUP BY p.id, p.name`,
    [projectId]
  );

  return result.rows;
}

export async function FullTreeWithGropusAndTestCases(projectId: number) {
  const result = await pool.query(
    `WITH RECURSIVE group_tree AS (
            SELECT 
                id AS group_id,
                name AS group_name,
                parent_group_id,
                project_id
            FROM test_case_groups
            WHERE project_id = $1 AND parent_group_id IS NULL

            UNION ALL

            SELECT
                g.id AS group_id,
                g.name AS group_name,
                g.parent_group_id,
                g.project_id
            FROM test_case_groups g
            INNER JOIN group_tree gt ON g.parent_group_id = gt.group_id
        )
        SELECT
            gt.group_id,
            gt.group_name,
            gt.parent_group_id,

            c.id AS case_id,
            c.title AS case_title,
            c.status AS case_status
        FROM group_tree gt
        LEFT JOIN test_cases c ON c.group_id = gt.group_id
        ORDER BY gt.parent_group_id, gt.group_id, c.id`,
    [projectId]
  );

  return result.rows;
}

//RUN TREE
export async function FullTreeWithGropusAndTestCasesForRun(
  //projectId: number,
  runId: number
) {
  const result = await pool.query(
    //     `WITH RECURSIVE relevant_groups AS (
    //     SELECT DISTINCT tcg.id, tcg.name, tcg.parent_group_id
    //     FROM test_case_groups tcg
    //     JOIN test_cases tc ON tc.group_id = tcg.id
    //     JOIN test_run_cases trc ON trc.test_case_id = tc.id
    //     WHERE trc.run_id = $1

    //     UNION ALL

    //     SELECT parent.id, parent.name, parent.parent_group_id
    //     FROM test_case_groups parent
    //     JOIN relevant_groups child
    //       ON parent.id = child.parent_group_id
    // )
    // SELECT DISTINCT
    //     rg.id AS group_id,
    //     rg.name AS group_name,
    //     rg.parent_group_id,
    //     tc.id AS case_id,
    //     tc.title AS case_title,
    //     tc.status AS case_status,
    //     tc.assigned_to
    // FROM relevant_groups rg
    // LEFT JOIN (
    //     SELECT tc.id, tc.title, trc.status, trc.assigned_to, tc.group_id
    //     FROM test_cases tc
    //     JOIN test_run_cases trc
    //       ON trc.test_case_id = tc.id
    //      AND trc.run_id = $1
    // ) tc
    //   ON tc.group_id = rg.id
    // ORDER BY rg.parent_group_id, rg.id, tc.id;

    // `,
    `WITH RECURSIVE relevant_groups AS (
      SELECT DISTINCT tcg.id, tcg.name, tcg.parent_group_id
      FROM test_case_groups tcg
      JOIN test_cases tc ON tc.group_id = tcg.id
      JOIN test_run_cases trc ON trc.test_case_id = tc.id
      WHERE trc.run_id = $1

      UNION ALL

      SELECT parent.id, parent.name, parent.parent_group_id
      FROM test_case_groups parent
      JOIN relevant_groups child
        ON parent.id = child.parent_group_id
  )
  SELECT DISTINCT
      rg.id AS group_id,
      rg.name AS group_name,
      rg.parent_group_id,
      tc.id AS case_id,
      tc.title AS case_title,
      tc.status AS case_status,
      tc.assigned_to,
    tc.assigned_to_name
  FROM relevant_groups rg
  LEFT JOIN (
      SELECT
          tc.id,
          tc.title,
          trc.status,
          trc.assigned_to,
          u.name AS assigned_to_name,
          tc.group_id
      FROM test_cases tc
      JOIN test_run_cases trc 
        ON trc.test_case_id = tc.id
      AND trc.run_id = $1
      LEFT JOIN users u
        ON u.id = trc.assigned_to
  ) tc
  ON tc.group_id = rg.id
  ORDER BY rg.parent_group_id, rg.id, tc.id`,
    [runId]
  );

  return result.rows;
}
