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
type TestItem = { title: string; status: string; assigned_to: string };

const STATUS_COLORS: Record<string, string> = {
  OK: "#22c55e", // zielony
  NOK: "#ef4444", // czerwony
  BLOCKED: "#3b82f6", // niebieski
  untested: "#9ca3af", // szary
};

export default function ReportsPage() {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [byUser, setByUser] = useState<UserItem[]>([]);
  const [list, setList] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(false);

  // symulacja fetcha
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setSummary([
        { status: "OK", count: 12 },
        { status: "NOK", count: 3 },
        { status: "BLOCKED", count: 2 },
        { status: "untested", count: 5 },
      ]);
      setByUser([
        { user: "Alice", count: 6 },
        { user: "Bob", count: 5 },
        { user: "Charlie", count: 11 },
      ]);
      setList([
        { title: "Login Test", status: "OK", assigned_to: "Alice" },
        { title: "Signup Test", status: "NOK", assigned_to: "Bob" },
        { title: "Payment Test", status: "BLOCKED", assigned_to: "Charlie" },
        { title: "Logout Test", status: "untested", assigned_to: "Unassigned" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Test Run Report</h2>

      {/* SUMMARY BOXES */}
      <div className="grid grid-cols-4 gap-4 mb-6">
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
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Pie chart status */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={summary}
                dataKey="count"
                nameKey="status"
                innerRadius={40}
                outerRadius={80}
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
        </div>

        {/* Bar chart users */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-bold mb-2">Tests by User</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byUser}>
              <XAxis dataKey="user" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLE */}
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

      {/* EXPORT BUTTON */}
      <div className="mt-4">
        <button className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
          Export CSV
        </button>
      </div>

      {loading && <div className="mt-4 text-gray-500">Loading...</div>}
    </div>
  );
}
