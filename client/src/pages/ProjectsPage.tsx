import { useState, useEffect } from "react";
import { type Project, fetchProjects } from "../api/projects";
import { NavLink, Outlet } from "react-router-dom";

export default function ProjectsPage() {
    // const [projects, setProjects] = useState<Project[]>([]);
    // const [loading, setLoading] = useState(true);
    // const [error, setError] = useState<string | null>(null);

    // useEffect(() => {
    //     const token = localStorage.getItem("token");
    //     if (!token) return;

    //     fetchProjects(token)
    //     .then(setProjects)
    //     .catch((error) => setError(error instanceof Error ? error.message : String(error)))
    //     .finally(() => setLoading(false));
    // });

    // if (loading) return <p>Ładowanie projektów...</p>;
    // if (error) return <p style={{ color: "red" }}>Błąd: {error}</p>;

    return (
      // <>
      //   <NavLink to="/projects/new" className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
      //     Create new project
      //   </NavLink>
      //   <NavLink to="/projects/members" className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
      //     Add members to project
      //   </NavLink>
        
      //   <ul>
      //     {projects.map((p) => (
      //       <li key={p.id}>
      //         <strong>{p.name}</strong> utworzony przez użytkownika {p.created_by}; opis <strong>{p.description}</strong>
      //       </li>
      //     ))}
      //   </ul>
      // </>

      <div className="flex min-h-screen bg-gray-200">
        <aside className="w-64 bg-gray-100 text-black flex flex-col p-4">
          <nav className="flex flex-col gap-2">
            <NavLink to="/projects/new" className={({ isActive }) =>`p-2 rounded-md hover:bg-gray-200 transition ${isActive ? "bg-gray-200 font-semibold" : ""}`}>
              New Project 
            </NavLink>
            <NavLink to="/projects/members" className={({ isActive }) =>`p-2 rounded-md hover:bg-gray-200 transition ${isActive ? "bg-gray-300 font-semibold" : ""}`}>
              Project members
            </NavLink>
          </nav>
        </aside>
        <main>
          <Outlet />
        </main>
      </div>
    );
}