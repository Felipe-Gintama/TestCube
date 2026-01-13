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

// export async function fetchFullTreeForRun(
//   //projectId: number,
//   runId: number,
//   token: string
// ) {
//   const res = await fetch(
//     `http://localhost:4000/api/groups/${runId}/groups/testCases/tree`,
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );

//   if (!res.ok) throw new Error("Failed to fetch tree");
//   return res.json();
// }

export async function fetchFullTreeForRun(
  runId: number,
  token: string,
  assignedTo: number | null = null,
  statuses: string[] | null = null
) {
  const query = new URLSearchParams();
  if (assignedTo !== null) query.append("assigned_to", assignedTo.toString());
  if (statuses?.length) query.append("statuses", statuses.join(",")); // CSV

  const url = `http://localhost:4000/api/groups/${runId}/groups/testCases/tree${
    query.toString() ? `?${query.toString()}` : ""
  }`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const text = await res.text(); // najpierw pobieramy tekst, żeby debugować
  try {
    return JSON.parse(text); // parsujemy do JSON
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    throw new Error("Failed to parse JSON");
  }
}
