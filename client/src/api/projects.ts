export type Project = {
  id: number;
  name: string;
  description: string;
  created_by: number;
  github_repo?: string;
};

export async function fetchProjects(token: string): Promise<Project[]> {
  const res = await fetch("http://localhost:4000/api/projects", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Błąd pobierania projektów");
  }

  return res.json();
}
