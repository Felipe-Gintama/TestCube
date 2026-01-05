export async function fetchFullTree(projectId: number, token: string) {
  const res = await fetch(
    `http://localhost:4000/api/groups/projects/${projectId}/groups/testCases/tree`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch tree");
  return res.json();
}

export async function fetchFullTreeForRun(
  //projectId: number,
  runId: number,
  token: string
) {
  const res = await fetch(
    `http://localhost:4000/api/groups/${runId}/groups/testCases/tree`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch tree");
  return res.json();
}
