import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useApi } from "../api/auth";

export default function DashboardPage() {
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
    <div className="flex min-h-screen bg-gray-200">
      <aside className="w-64 bg-gray-100 text-black flex flex-col p-4">
        <nav className="flex flex-col gap-2">
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-300 font-semibold" : ""
              }`
            }
          >
            Projects
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Raports
          </NavLink>
          <NavLink
            to="/testing"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Testing
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            User management
          </NavLink>
          <NavLink
            to="/testCasesManagement"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Add/Delete test cases
          </NavLink>
          <NavLink
            to="/testPlans"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Test plan manager
          </NavLink>
          <NavLink
            to="/issues"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Github issues
          </NavLink>
        </nav>
      </aside>
      <main className="w-full p-2">
        {/* <div className="p-2 bg-gray-300 w-full">
          <div className="flex">
            <h1 className="px-2 w-100px font-bold">Run X</h1>
            <div className="mb-2 bg-green-500 w-40px">OK (liczba)</div>
            <div className="mb-2 bg-red-500 w-40px">NOK (liczba)</div>
            <div className="mb-2 bg-blue-500 w-40px">BLOCKED (liczba)</div>
            <div className="mb-2 bg-gray-500 w-40px">UNTESTED (liczba)</div>
          </div>

          <div className="flex">
            <div className="p-4 bg-green-500 w-full">PROGRESS X%</div>
          </div>
        </div>

        <div className="p-2 bg-gray-300 w-full">
          <div className="flex">
            <h1 className="px-2 w-100px font-bold">Run Y</h1>
            <div className="mb-2 bg-green-500 w-40px">OK (liczba)</div>
            <div className="mb-2 bg-red-500 w-40px">NOK (liczba)</div>
            <div className="mb-2 bg-blue-500 w-40px">BLOCKED (liczba)</div>
            <div className="mb-2 bg-gray-500 w-40px">UNTESTED (liczba)</div>
          </div>

          <div className="flex">
            <div className="p-4 bg-green-500 w-full">PROGRESS X%</div>
          </div>
        </div> */}

        <div className="p-6 bg-gray-100 min-h-screen flex flex-col gap-4">
          <h1 className="text-2xl font-bold mb-4">In-Progress Test Runs</h1>

          {runs.map((run) => {
            const progress = percent(run.ok + run.nok + run.blocked, run.total);
            return (
              <div key={run.id} className="p-4 bg-gray-300 rounded w-full">
                <div className="flex items-center mb-2">
                  <h2 className="px-2 font-bold whitespace-nowrap">
                    RUN ID: {run.id}
                  </h2>
                  <div className="flex gap-2 ml-auto">
                    <div className="p-2 bg-green-500 text-white text-sm rounded w-28 text-center">
                      OK: {run.ok}
                    </div>
                    <div className="p-2 bg-red-500 text-white text-sm rounded w-28 text-center">
                      NOK: {run.nok}
                    </div>
                    <div className="p-2 bg-blue-500 text-white text-sm rounded w-28 text-center">
                      BLOCKED: {run.blocked}
                    </div>
                    <div className="p-2 bg-gray-500 text-white text-sm rounded w-28 text-center">
                      UNTESTED: {run.untested}
                    </div>
                  </div>
                </div>
                <div className="relative h-6 w-full bg-gray-400 rounded overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                    {progress}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
