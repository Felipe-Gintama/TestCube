import { useState, useEffect } from "react";
import { type Project, fetchProjects } from "../api/projects";
type User = { id: number; name: string };

export default function AddMemberToProject() {

    const [projects, setProjects] = useState<Project[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedProject, setSelectedProject] = useState<number | "">("");
    const [selectedUser, setSelectedUser] = useState<number | "">("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");

        async function fetchData() {
        try {
            const [projectsRes, usersRes] = await Promise.all([
            fetch("http://localhost:4000/api/projects", {
                headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("http://localhost:4000/api/users", {
                headers: { Authorization: `Bearer ${token}` },
            }),
            ]);

            const projectsData = await projectsRes.json();
            const usersData = await usersRes.json();
            console.log(projectsData);
            
            setProjects(projectsData);
            setUsers(usersData);

        } catch (err) {
            console.error(err);
        }
        }

        fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProject || !selectedUser) {
      setMessage("Wybierz projekt i użytkownika");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      console.log(selectedProject);
      const res = await fetch(
        `http://localhost:4000/api/projects/${selectedProject}/members/${selectedUser}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: selectedUser }),
        }
      );

      if (!res.ok) throw new Error("Nie udało się dodać użytkownika");

      setMessage("Użytkownik dodany do projektu!");
      setSelectedProject("");
      setSelectedUser("");
    } catch (err) {
      console.error(err);
      setMessage(`Wystąpił błąd ${selectedProject} ${selectedUser}`);
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Add member to project</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <select value={selectedProject} onChange={(e) => {console.log("selected value raw:", e.target.value); setSelectedProject(Number(e.target.value))}} className="border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300">
                <option value="">Wybierz projekt</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                  ))}
            </select>
            <select value={selectedUser} onChange={(e) => setSelectedUser(Number(e.target.value))} className="border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300">
              <option value="">Wybierz użytkownika</option>
                {users.map((u) => (
                    <option key={u.id} value={u.id}>
                        {u.name}
                    </option>
                ))}
            </select>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                Zapisz
            </button>
        </form>
        {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
  );
}