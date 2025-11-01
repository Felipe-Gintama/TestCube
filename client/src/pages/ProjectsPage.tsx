import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { type Project, fetchProjects } from "../api/projects";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetchProjects(token)
        .then(setProjects)
        .catch((error) => setError(error instanceof Error ? error.message : String(error)))
        .finally(() => setLoading(false));
    });

    if (loading) return <p>Ładowanie projektów...</p>;
    if (error) return <p style={{ color: "red" }}>Błąd: {error}</p>;

    return (<ul>
          {projects.map((p) => (
            <li key={p.id}>
              <strong>{p.name}</strong> (utworzony przez użytkownika {p.created_by}; opis <strong>{p.description}</strong>
            </li>
          ))}
        </ul>
    );
}