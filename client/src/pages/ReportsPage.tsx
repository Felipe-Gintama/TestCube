import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

type SummaryItem = { status: string; count: number };
type UserItem = { user: string; count: number };
type TestItem = {
  title: string;
  status: string;
  assigned_to: string;
};

type TestRun = {
  test_run_id: number;
  test_plan_id: number;
  plan_name: string;
  release_version: string;
  started_at: string;
  finished_at: string;
  status: string;
};

type ActiveRun = {
  id: number;
  started_at: string;
  finished_at: string;
  status: string;
};

const STATUS_COLORS: Record<string, string> = {
  OK: "#22c55e",
  NOK: "#ef4444",
  BLOCKED: "#3b82f6",
  untested: "#9ca3af",
};
const ALL_STATUSES = ["OK", "NOK", "BLOCKED", "untested"] as const;

export default function ReportsPage() {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [byUser, setByUser] = useState<UserItem[]>([]);
  const [list, setList] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [activeRun, setActiveRun] = useState<ActiveRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<number | 0>(0);

  const apiFetch = async (url: string, opts: RequestInit = {}) => {
    const token = localStorage.getItem("token");
    const headers = opts.headers ? (opts.headers as any) : {};
    const merged = {
      ...opts,
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    };
    const res = await fetch(url, merged);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text}`);
    }
    return res.json();
  };

  const token = localStorage.getItem("token");
  // useEffect(() => {
  //   async function loadRuns() {
  //     try {
  //       const res = await apiFetch(
  //         "http://localhost:4000/api/test_runs/getAll",
  //         {
  //           headers: { Authorization: `Bearer ${token}` },
  //         }
  //       );
  //       const data = await res.json();
  //       setRuns(data);

  //       // automatycznie wybierz pierwszy run
  //       if (data.length > 0) {
  //         setSelectedRunId(data[0].id);
  //       }
  //     } catch (err) {
  //       console.error("RUNS LOAD ERROR", err);
  //     }
  //   }

  //   loadRuns();
  // }, []);

  useEffect(() => {
    async function loadRuns() {
      try {
        const res = await apiFetch(
          "http://localhost:4000/api/test_runs/getAll"
        );
        console.log("runs: ", res);
        setRuns(res);
      } catch (e) {
        console.error(e);
        setRuns([]);
      }
    }
    loadRuns();
  }, []);

  useEffect(() => {
    async function loadRun() {
      try {
        const res = await apiFetch(
          `http://localhost:4000/api/test_runs/testRuns/${selectedRunId}`
        );
        setActiveRun(res);
        console.log("active run", activeRun);
      } catch (e) {
        console.error(e);
        setActiveRun([]);
      }
    }
    loadRun();
  }, [selectedRunId]);

  useEffect(() => {
    if (!selectedRunId) return;

    async function loadReport() {
      try {
        setLoading(true);

        const res = await fetch(
          `http://localhost:4000/api/reports/run/${selectedRunId}`
        );

        if (!res.ok) throw new Error("Failed to load report");

        const data = await res.json();

        setSummary(data.summary ?? []);
        setByUser(data.byUser ?? []);
        setList(data.tests ?? []);
      } catch (err) {
        console.error("REPORT LOAD ERROR:", err);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [selectedRunId]);

  function exportCSV() {
    if (list.length === 0) return;

    const headers = ["Title", "Status", "Assigned To"];

    const rows = list.map((t) => [
      `"${t.title}"`,
      `"${t.status}"`,
      `"${t.assigned_to}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "test-run-report.csv");
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const summaryWithZeros = ALL_STATUSES.map((status) => {
    const found = summary.find((s) => s.status === status);
    return {
      status,
      count: found ? found.count : 0,
    };
  });

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Test Run Report</h2>
      <div className="bg-white p-4 rounded shadow mb-4 flex items-center gap-4">
        <label className="font-semibold">Test Run:</label>

        {/* <select
          value={selectedRunId ?? ""}
          onChange={(e) => setSelectedRunId(Number(e.target.value))}
          className="border rounded px-3 py-1"
        >
          {runs.map((run) => (
            <option key={run.id} value={run.id}>
              {run.name || `Run #${run.id}`} ({run.status})
            </option>
          ))}
        </select> */}

        <select
          value={selectedRunId ?? ""}
          onChange={(e) => setSelectedRunId(Number(e.target.value))}
        >
          <option value="">Select Run</option>
          {runs.map((r) => (
            <option key={r.test_run_id} value={r.test_run_id}>
              {r.test_run_id} ({r.release_version}) ({r.test_plan_id})
            </option>
          ))}
        </select>
      </div>

      {/* SUMMARY BOXES */}
      {/* <div className="grid grid-cols-4 gap-4 mb-6">
        {summary.map((s) => (
          <div
            key={s.status}
            className={`p-4 rounded text-white flex flex-col items-center justify-center`}
            style={{ backgroundColor: STATUS_COLORS[s.status] || "#6b7280" }}
          >
            <div className="text-sm font-semibold">{s.status}</div>
            <div className="text-2xl font-bold">{s.count}</div>
          </div>
        ))}
      </div> */}

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Pie chart status */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Status Distribution</h3>
          {summary.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={summary}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={40}
                  outerRadius={100}
                  paddingAngle={5}
                >
                  {summary.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || "#6b7280"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart users */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Summary</h3>
          {/* <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byUser}>
              <XAxis dataKey="user" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer> */}
          <div className="flex flex-col gap-4 mb-6">
            {summaryWithZeros.map((s) => (
              <div
                key={s.status}
                className="p-4 rounded text-white flex flex-col"
                style={{
                  backgroundColor: STATUS_COLORS[s.status] || "#6b7280",
                  opacity: s.count === 0 ? 0.5 : 1, // opcjonalnie
                }}
              >
                <div className="text-sm font-semibold">
                  {s.status} | {s.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE */}
      {selectedRunId > 0 && (
        <>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">Run</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2">Run ID</th>
                  <th className="border-b p-2">Status</th>
                  <th className="border-b p-2">Started at</th>
                  <th className="border-b p-2">Finished at</th>
                </tr>
              </thead>
              <tbody>
                {activeRun.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="border-b p-2">{r.id}</td>
                    <td className="border-b p-2">{r.status}</td>
                    <td className="border-b p-2">{r.started_at ?? "brak"}</td>
                    <td className="border-b p-2">{r.finished_at ?? "brak"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">All Tests</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="border-b p-2">Title</th>
                  <th className="border-b p-2">Status</th>
                  <th className="border-b p-2">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border-b p-2">{t.title}</td>
                    <td
                      className="border-b p-2 font-bold"
                      style={{ color: STATUS_COLORS[t.status] || "#000" }}
                    >
                      {t.status}
                    </td>
                    <td className="border-b p-2">{t.assigned_to}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">Run</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2">Run ID</th>
              <th className="border-b p-2">Status</th>
              <th className="border-b p-2">Started at</th>
              <th className="border-b p-2">Finished at</th>
            </tr>
          </thead>
          <tbody>
            {activeRun.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="border-b p-2">{r.id}</td>
                <td className="border-b p-2">{r.status}</td>
                <td className="border-b p-2">{r.started_at ?? "brak"}</td>
                <td className="border-b p-2">{r.finished_at ?? "brak"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">All Tests</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2">Title</th>
              <th className="border-b p-2">Status</th>
              <th className="border-b p-2">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {list.map((t, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border-b p-2">{t.title}</td>
                <td
                  className="border-b p-2 font-bold"
                  style={{ color: STATUS_COLORS[t.status] || "#000" }}
                >
                  {t.status}
                </td>
                <td className="border-b p-2">{t.assigned_to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}

      {/* EXPORT BUTTON */}
      <div className="mt-4">
        <button
          onClick={exportCSV}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Export CSV
        </button>
      </div>

      {loading && <div className="mt-4 text-gray-500">Loading...</div>}
    </div>
  );
}
