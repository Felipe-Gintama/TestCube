import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useApi } from "../api/auth";
import { Project } from "../api/projects";

function useProjectsApi() {
  const { apiFetch } = useApi();

  return {
    fetchProjects: () => apiFetch("http://localhost:4000/api/projects"),
    fetchUsers: () => apiFetch("http://localhost:4000/api/users"),

    fetchUsersFromProject: (projectId: number) =>
      apiFetch(`http://localhost:4000/api/projects/${projectId}/users`),

    updateProject: (
      projectId: number,
      description: string,
      githubRepo: string,
    ) =>
      apiFetch(`http://localhost:4000/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          github_repo: githubRepo || null,
        }),
      }),

    addMember: (projectId: number, userId: number) =>
      apiFetch(
        `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
        { method: "POST" },
      ),

    removeMember: (projectId: number, userId: number) =>
      apiFetch(
        `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
        { method: "DELETE" },
      ),

    deleteProject: (projectId: number) =>
      apiFetch(`http://localhost:4000/api/projects/${projectId}`, {
        method: "DELETE",
      }),

    createProject: (name: string, desc: string, githubRepo: string | null) =>
      apiFetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc, repo: githubRepo }),
      }),
  };
}

export default function DashboardPage() {
  // FAKE API ------------------------------------------------
  const tests = [
    {
      id: 101,
      name: "Login Test",
      project: "Project Alpha",
      status: "OK",
      date: "2026-02-10",
    },
    {
      id: 102,
      name: "Signup Flow",
      project: "Project Beta",
      status: "NOK",
      date: "2026-02-09",
    },
    {
      id: 103,
      name: "Checkout Test",
      project: "Project Alpha",
      status: "Blocked",
      date: "2026-02-09",
    },
    {
      id: 104,
      name: "Profile Update",
      project: "Project Gamma",
      status: "OK",
      date: "2026-02-08",
    },
    {
      id: 105,
      name: "Search Function",
      project: "Project Beta",
      status: "Untested",
      date: "2026-02-07",
    },
  ];

  // Map status na kolor
  const statusColor = {
    OK: "bg-green-500",
    NOK: "bg-red-500",
    Blocked: "bg-blue-500",
    Untested: "bg-gray-500",
  };
  //----------------------------------------------------------------

  const api = useProjectsApi();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const { apiFetch } = useApi();

  type Run = {
    id: number;
    total: number;
    ok: number;
    nok: number;
    blocked: number;
    untested: number;
    status: string;
  };

  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(false);

  // const apiFetch = async (url: string, opts: RequestInit = {}) => {
  //   const token = localStorage.getItem("token");
  //   const headers = opts.headers ? (opts.headers as any) : {};
  //   const merged = {
  //     ...opts,
  //     headers: {
  //       ...headers,
  //       Authorization: token ? `Bearer ${token}` : undefined,
  //     },
  //   };
  //   const res = await fetch(url, merged);
  //   if (!res.ok) {
  //     const text = await res.text();
  //     throw new Error(`API error ${res.status}: ${text}`);
  //   }
  //   return res.json();
  // };
  useEffect(() => {
    async function load() {
      const [projectsData, usersData] = await Promise.all([
        api.fetchProjects(),
        api.fetchUsers(),
      ]);
      setProjects(projectsData);
    }
    load();
  }, []);

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);

        const data = await apiFetch(
          "http://localhost:4000/api/test_runs/runsInProgress",
        );

        setRuns(data);
      } catch (err) {
        console.error("DASHBOARD LOAD ERROR", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function percent(value: number, total: number) {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex">
      {/* MAIN CONTENT CARD */}
      <div className="bg-white flex flex-col rounded-xl shadow-xl p-8 w-1/2 mx-2 ">
        <div className="bg-white rounded shadow overflow-hidden mb-6 border border-gray-300">
          <table className="w-full text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">GitHub Repo</th>
                <th className="p-2 text-left">Created</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.description}</td>
                  <td className="p-2">{p.github_repo || "-"}</td>
                  <td className="p-2">{p.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border border-gray-300 bg-white rounded-xl shadow-xl p-6 w-full flex flex-col gap-4">
          <h2 className="font-bold text-lg">Latest Test Runs</h2>
          <ul className="flex flex-col gap-2">
            {tests.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between bg-gray-50 p-3 rounded shadow hover:shadow-md transition"
              >
                {/* Lewa strona – test i projekt */}
                <div className="flex flex-col">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-gray-500 text-sm">{t.project}</span>
                </div>

                {/* Prawa strona – status i data */}
                <div className="flex gap-2 items-center">
                  <span
                  // className={`${statusColor[t.status]} text-white px-3 py-1 rounded font-semibold`}
                  >
                    {t.status}
                  </span>
                  <span className="text-gray-500 text-sm">{t.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* progress bar */}
      <div className="bg-white rounded-xl shadow-xl p-8 w-1/2 mx-2">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          In-Progress Test Runs
        </h1>

        {loading && <p className="text-gray-500 font-semibold">Loading...</p>}

        <div className="flex flex-col gap-6">
          {runs.map((run) => {
            const progress = percent(run.ok + run.nok + run.blocked, run.total);

            return (
              <div
                key={run.id}
                className="rounded-md shadow-md border border-gray-300 hover:shadow-lg transition w-full overflow-hidden"
              >
                <div className="bg-gray-200 text-black px-6 py-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col">
                      <h2 className="font-bold text-sm">RUN: {run.id}</h2>
                      {/* <h2 className="font-bold text-sm">
                        Progress: {progress}%
                      </h2> */}
                    </div>
                    <div className="flex gap-3 text-sm font-semibold text-white">
                      <div className="bg-green-500 px-3 py-1 rounded">
                        OK: {run.ok}
                      </div>
                      <div className="bg-red-500 px-3 py-1 rounded">
                        NOK: {run.nok}
                      </div>
                      <div className="bg-blue-400 px-3 py-1 rounded">
                        BLOCKED: {run.blocked}
                      </div>
                      <div className="bg-gray-500 px-3 py-1 rounded">
                        UNTESTED: {run.untested}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white-100 p-4">
                  <div className="relative h-6 w-full bg-gray-300 rounded-full overflow-hidden flex">
                    <div
                      className="bg-green-500 h-full"
                      style={{ width: `${percent(run.ok, run.total)}%` }}
                    />
                    <div
                      className="bg-red-500 h-full"
                      style={{ width: `${percent(run.nok, run.total)}%` }}
                    />
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: `${percent(run.blocked, run.total)}%` }}
                    />
                    <div
                      className="bg-gray-500 h-full"
                      style={{ width: `${percent(run.untested, run.total)}%` }}
                    />

                    <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                      {progress}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
