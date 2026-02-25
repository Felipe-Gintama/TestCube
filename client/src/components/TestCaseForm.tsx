import { Delete } from "lucide-react";
import { useEffect, useState } from "react";

interface TestCase {
  id: number;
  title: string;
  description: string;
  expected_result: string;
}

interface TestPoint {
  id: number | "new";
  description: string;
  position: number;
}

interface Props {
  testCaseId: number | null;
  token: string | null;
  groupId: number;
  onSaved?: (newTest: TestCase) => void;
  onDeleted?: (id: number) => void;
}

export default function TestCaseForm({
  testCaseId,
  token,
  groupId,
  onSaved,
  onDeleted,
}: Props) {
  const isNew = testCaseId === null;
  const [loading, setLoading] = useState(true);
  const [testCase, setTestCase] = useState<TestCase>({
    id: 0,
    title: "",
    description: "",
    expected_result: "",
  });
  const [points, setPoints] = useState<TestPoint[]>([]);

  useEffect(() => {
    if (!token) return;

    if (isNew) {
      setLoading(false);
      setPoints([]);
      return;
    }

    async function load() {
      try {
        const [caseRes, pointsRes] = await Promise.all([
          fetch(`http://localhost:4000/api/test_cases/${testCaseId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(
            `http://localhost:4000/api/test_case_points/${testCaseId}/points`,
            { headers: { Authorization: `Bearer ${token}` } },
          ),
        ]);

        const caseData: TestCase = await caseRes.json();
        const pointsData: TestPoint[] = await pointsRes.json();

        setTestCase(caseData);
        setPoints(Array.isArray(pointsData) ? pointsData : []);
      } catch (err) {
        console.error("Błąd ładowania testu:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [testCaseId, token]);

  // ----------------------------
  // Points handlers
  // ----------------------------
  const addPoint = () =>
    setPoints((prev) => [
      ...prev,
      { id: "new", description: "", position: prev.length + 1 },
    ]);
  const updatePoint = (index: number, value: string) =>
    setPoints((prev) =>
      prev.map((p, i) => (i === index ? { ...p, description: value } : p)),
    );
  const deletePoint = (index: number) =>
    setPoints((prev) => prev.filter((_, i) => i !== index));

  const handleDelete = async () => {
    if (!token || !testCaseId) return;

    if (!confirm("Czy na pewno chcesz usunąć ten test?")) return;

    try {
      await fetch(`http://localhost:4000/api/test_cases/${testCaseId}/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      onDeleted?.(testCaseId);
    } catch (err) {
      console.error("Błąd podczas usuwania testu:", err);
    }
  };
  // ----------------------------
  // Save handler
  // ----------------------------
  const handleSave = async () => {
    if (!token) return;

    try {
      let savedTestCase = testCase;

      // --- CREATE NEW TEST ---
      if (isNew) {
        const res = await fetch(`http://localhost:4000/api/test_cases`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...testCase,
            project_id: 1,
            group_id: groupId,
          }),
        });
        savedTestCase = await res.json();
        onSaved?.(savedTestCase);
        return;
      }

      // --- UPDATE EXISTING TEST ---
      await fetch(`http://localhost:4000/api/test_cases/${testCaseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testCase),
      });

      const originalPoints: TestPoint[] = await fetch(
        `http://localhost:4000/api/test_case_points/${testCaseId}/points`,
        { headers: { Authorization: `Bearer ${token}` } },
      ).then((r) => r.json());

      const existingIds = points.filter((p) => p.id !== "new").map((p) => p.id);
      for (const p of originalPoints) {
        if (!existingIds.includes(p.id)) {
          await fetch(`http://localhost:4000/api/test_case_points/${p.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }

      // --- Update / Add points ---
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (point.id === "new") {
          const res = await fetch(
            `http://localhost:4000/api/test_case_points`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                test_case_id: testCase.id,
                description: point.description,
                position: i + 1,
              }),
            },
          );
          points[i].id = (await res.json()).id;
        } else {
          await fetch(
            `http://localhost:4000/api/test_case_points/${point.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                description: point.description,
                position: i + 1,
              }),
            },
          );
        }
      }

      onSaved?.(testCase);
    } catch (err) {
      console.error("Błąd zapisu testu:", err);
    }
  };

  // ----------------------------
  // Render
  // ----------------------------
  if (loading) return <div>Ładowanie...</div>;

  // return (
  //   <div className="p-4 bg-white rounded shadow space-y-4">
  //     <h2 className="text-xl font-bold">
  //       {isNew ? "Nowy test" : "Edytuj test"}
  //     </h2>

  //     <input
  //       value={testCase.title}
  //       onChange={(e) => setTestCase({ ...testCase, title: e.target.value })}
  //       className="w-full border p-2 rounded"
  //       placeholder="Tytuł testu"
  //     />

  //     <textarea
  //       value={testCase.description}
  //       onChange={(e) =>
  //         setTestCase({ ...testCase, description: e.target.value })
  //       }
  //       className="w-full border p-2 rounded"
  //       placeholder="Opis testu"
  //     />

  //     <textarea
  //       value={testCase.expected_result}
  //       onChange={(e) =>
  //         setTestCase({ ...testCase, expected_result: e.target.value })
  //       }
  //       className="w-full border p-2 rounded"
  //       placeholder="Oczekiwany wynik"
  //     />

  //     <div>
  //       <h3 className="font-semibold mb-2">Punkty testowe</h3>
  //       {points.map((p, idx) => (
  //         <div key={p.id + "-" + idx} className="flex gap-2 mb-2 items-center">
  //           <span>{idx + 1}.</span>
  //           <input
  //             value={p.description}
  //             onChange={(e) => updatePoint(idx, e.target.value)}
  //             className="flex-1 border p-2 rounded"
  //           />
  //           <button
  //             type="button"
  //             onClick={() => deletePoint(idx)}
  //             className="text-red-500 hover:text-red-700"
  //           >
  //             X
  //           </button>
  //         </div>
  //       ))}
  //       <button
  //         type="button"
  //         onClick={addPoint}
  //         className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
  //       >
  //         Dodaj punkt
  //       </button>
  //       <button
  //         type="button"
  //         onClick={handleDelete}
  //         className="mt-2 px-3 py-1 bg-red-500 text-white rounded ml-3"
  //       >
  //         Delete case
  //       </button>
  //     </div>

  //     <button
  //       onClick={handleSave}
  //       className="w-full py-2 bg-blue-600 text-white rounded"
  //     >
  //       Zapisz zmiany
  //     </button>
  //   </div>
  // );
  return (
    <div className="bg-white border border-gray-300 rounded-xl shadow-sm p-6 w-full max-w-3xl">
      <h2 className="text-lg font-bold text-gray-800 mb-6">
        {isNew ? "New test case" : "Edit test case"}
      </h2>

      {/* ===== BASIC INFO ===== */}
      <div className="space-y-4 mb-8">
        <input
          value={testCase.title}
          onChange={(e) => setTestCase({ ...testCase, title: e.target.value })}
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm
                   focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="Name"
        />

        <textarea
          value={testCase.description}
          onChange={(e) =>
            setTestCase({ ...testCase, description: e.target.value })
          }
          rows={4}
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm
                   focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="Test case description"
        />

        <textarea
          value={testCase.expected_result}
          onChange={(e) =>
            setTestCase({
              ...testCase,
              expected_result: e.target.value,
            })
          }
          rows={3}
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm
                   focus:outline-none focus:ring-2 focus:ring-emerald-400"
          placeholder="Expected result"
        />
      </div>

      {/* ===== TEST STEPS ===== */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          Test case points
        </h3>

        <div className="space-y-3">
          {points.map((p, idx) => (
            <div
              key={p.id + "-" + idx}
              className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-md p-3"
            >
              <span className="text-sm font-medium text-gray-600">
                {idx + 1}.
              </span>

              <input
                value={p.description}
                onChange={(e) => updatePoint(idx, e.target.value)}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-md text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Description"
              />

              <button
                type="button"
                onClick={() => deletePoint(idx)}
                className="text-rose-600 hover:text-rose-800 text-sm font-semibold"
              >
                <Delete className="cursor-pointer text-rose-500 hover:text-rose-700"></Delete>
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <button
            type="button"
            onClick={addPoint}
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md
                     hover:bg-emerald-700 transition"
          >
            Add point
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 text-white text-sm rounded-md
                       hover:bg-rose-700 transition"
            >
              Delete test case
            </button>
          )}
        </div>
      </div>

      {/* ===== SAVE BUTTON ===== */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <button
          onClick={handleSave}
          className="w-full py-2 bg-emerald-600 text-white text-sm rounded-md
                   hover:bg-emerald-700 transition"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
