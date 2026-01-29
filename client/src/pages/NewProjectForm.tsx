import { useState } from "react";
import { useApi } from "../hooks/apiFetch";

function useProjectsApi() {
  const { apiFetch } = useApi();

  return {
    createProject: (name: string, desc: string) =>
      apiFetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc }),
      }),
  };
}

function NewProjectForm() {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const api = useProjectsApi();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!name) {
      setError("Project name is required");
      return;
    }

    try {
      const project = await api.createProject(name, desc);
      setMessage(`Project created: ${project.name}`);
      setName("");
      setDesc("");
    } catch (err: any) {
      setError(err?.message || "Failed to create project");
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Utwórz nowy projekt</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nazwa projektu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded-md"
        />

        <input
          type="text"
          placeholder="Opis projektu"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          className="border p-2 rounded-md"
        />

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Zapisz
        </button>
      </form>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}

export default NewProjectForm;
