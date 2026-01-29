import { useState, useEffect } from "react";
import { useApi } from "../hooks/apiFetch";
import type { Project } from "../api/projects";

type User = { id: number; name: string };

function useProjectsApi() {
  const { apiFetch } = useApi();

  return {
    fetchProjects: () => apiFetch("http://localhost:4000/api/projects"),
    createProject: (name: string, desc: string, githubRepo: string | null) =>
      apiFetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc, github_repo: githubRepo }),
      }),
    addMember: (projectId: number, userId: number) =>
      apiFetch(
        `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        },
      ),
    fetchUsers: () => apiFetch("http://localhost:4000/api/users"),
  };
}

export default function ProjectsPage() {
  const api = useProjectsApi();

  // --- New Project ---
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [githubRepo, setGithubRepo] = useState("");
  const [projectMessage, setProjectMessage] = useState<string | null>(null);

  // --- Add Member ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [selectedUser, setSelectedUser] = useState<number | "">("");
  const [memberMessage, setMemberMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsData, usersData] = await Promise.all([
          api.fetchProjects(),
          api.fetchUsers(),
        ]);
        setProjects(projectsData);
        setUsers(usersData);
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, []);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setProjectMessage(null);

    if (!name) return setProjectMessage("Project name is required");

    try {
      const project = await api.createProject(name, desc, githubRepo || null);
      setProjectMessage(`Project created: ${project.name}`);
      setName("");
      setDesc("");
      setGithubRepo("");
      setProjects((prev) => [...prev, project]); // dodaj nowy projekt do listy
    } catch (err: any) {
      setProjectMessage(err?.message || "Failed to create project");
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setMemberMessage(null);

    if (!selectedProject || !selectedUser) {
      return setMemberMessage("Select a project and a user");
    }

    try {
      await api.addMember(selectedProject, selectedUser);
      setMemberMessage("User added to project!");
      setSelectedProject("");
      setSelectedUser("");
    } catch (err: any) {
      setMemberMessage(err?.message || "Failed to add member");
    }
  }

  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Projects Management</h1>

      {/* --- New Project --- */}
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Project Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-2 rounded-md"
          />
          <input
            type="text"
            placeholder="Project Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="border p-2 rounded-md"
          />
          <input
            type="text"
            placeholder="GitHub Repo (owner/repo)"
            value={githubRepo}
            onChange={(e) => setGithubRepo(e.target.value)}
            className="border p-2 rounded-md"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            Create Project
          </button>
        </form>
        {projectMessage && (
          <p className="mt-2 text-gray-700">{projectMessage}</p>
        )}
      </div>

      {/* --- Add Member --- */}
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Add Member to Project</h2>
        <form onSubmit={handleAddMember} className="flex flex-col gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(Number(e.target.value))}
            className="border p-2 rounded-md"
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(Number(e.target.value))}
            className="border p-2 rounded-md"
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
          >
            Add Member
          </button>
        </form>
        {memberMessage && <p className="mt-2 text-gray-700">{memberMessage}</p>}
      </div>
    </main>
  );
}
