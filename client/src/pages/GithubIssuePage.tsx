// src/components/CreateGithubIssue.tsx
import { useState, useEffect } from "react";
import { fetchProjects, type Project } from "../api/projects";
import { useGithubApi } from "../hooks/useGithubApi";

export default function CreateGithubIssue() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  const { createIssue } = useGithubApi();

  useEffect(() => {
    const token = localStorage.getItem("token");

    async function loadProjects() {
      try {
        const res = await fetch("http://localhost:4000/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
      }
    }

    loadProjects();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedProject || !title) {
      setMessage("Wybierz projekt i wpisz tytuł issue");
      return;
    }

    const project = projects.find((p) => p.id === selectedProject);
    if (!project || !project.github_repo) {
      setMessage("Wybrany projekt nie ma przypisanego repo GitHub");
      return;
    }

    try {
      await createIssue(project.github_repo, title, body);
      setMessage(`Issue "${title}" utworzone w repo ${project.github_repo}`);
      setTitle("");
      setBody("");
      setSelectedProject("");
    } catch (err: any) {
      console.error(err);
      setMessage("Nie udało się utworzyć issue");
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Create GitHub Issue</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(Number(e.target.value))}
          className="border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        >
          <option value="">Select project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.github_repo || "no repo"})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Issue title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />

        <textarea
          placeholder="Issue description (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
        >
          Create Issue
        </button>
      </form>

      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
  );
}
