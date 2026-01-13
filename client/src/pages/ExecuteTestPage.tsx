import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

/* =========================
   TYPES
========================= */

interface TestCase {
  id: number;
  title: string;
  description: string;
  expected_result: string;
}

interface TestPoint {
  id: number;
  description: string;
  position: number;
}

type TestStatus = "OK" | "NOK" | "BLOCKED";

/* =========================
   COMPONENT
========================= */

export default function ExecuteTestPage() {
  const { testId, runId } = useParams<{ testId: string; runId: string }>();
  const token = localStorage.getItem("token");

  const [loading, setLoading] = useState(true);
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [points, setPoints] = useState<TestPoint[]>([]);
  const [status, setStatus] = useState<TestStatus | null>(null);
  const [comment, setComment] = useState("");

  /* =========================
     LOAD TEST + POINTS
  ========================= */

  useEffect(() => {
    if (!token || !testId) return;

    async function load() {
      try {
        const [caseRes, pointsRes] = await Promise.all([
          fetch(`http://localhost:4000/api/test_cases/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:4000/api/test_case_points/${testId}/points`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setTestCase(await caseRes.json());
        setPoints(await pointsRes.json());
      } catch (err) {
        console.error("Błąd ładowania testu:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [testId, token]);

  /* =========================
     FINISH TEST
  ========================= */

  async function finishTest() {
    if (!token || !runId || !testId || !status) return;

    try {
      await fetch(`http://localhost:4000/api/test_runs/finishTestCase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: status,
          comment: comment,
          runId: Number(runId),
          testId: Number(testId),
        }),
      });

      window.close();
    } catch (err) {
      console.error("Błąd zapisu wyniku testu:", err);
    }
  }

  /* =========================
     RENDER
  ========================= */

  if (loading) return <div className="p-4">Ładowanie...</div>;
  if (!testCase) return <div className="p-4">Brak danych</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 space-y-4">
      <h1 className="text-2xl font-bold">{testCase.title}</h1>

      {/* DESCRIPTION */}
      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-1">Opis</h3>
        <p className="whitespace-pre-line">{testCase.description}</p>
      </section>

      {/* EXPECTED */}
      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-1">Oczekiwany wynik</h3>
        <p className="whitespace-pre-line">{testCase.expected_result}</p>
      </section>

      {/* STEPS */}
      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Kroki testowe</h3>
        <ol className="list-decimal pl-5 space-y-2">
          {points.map((p) => (
            <li key={p.id} className="bg-gray-50 p-2 rounded">
              {p.description}
            </li>
          ))}
        </ol>
      </section>

      {/* COMMENT */}
      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-1">Komentarz</h3>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </section>

      {/* STATUS BUTTONS */}
      <section className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-3">Wynik testu</h3>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setStatus("OK")}
            className={`px-6 py-2 rounded text-white ${
              status === "OK" ? "bg-green-600" : "bg-green-400"
            }`}
          >
            OK
          </button>

          <button
            onClick={() => setStatus("NOK")}
            className={`px-6 py-2 rounded text-white ${
              status === "NOK" ? "bg-red-600" : "bg-red-400"
            }`}
          >
            NOK
          </button>

          <button
            onClick={() => setStatus("BLOCKED")}
            className={`px-6 py-2 rounded text-white ${
              status === "BLOCKED" ? "bg-yellow-600" : "bg-yellow-400"
            }`}
          >
            BLOCKED
          </button>
        </div>
      </section>

      {/* FINISH */}
      <div className="flex justify-center pt-4">
        <button
          onClick={finishTest}
          disabled={!status}
          className="px-6 py-3 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          Zakończ test
        </button>
      </div>
    </div>
  );
}
