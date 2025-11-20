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

export default function EditTestCaseForm({ testCaseId, token, onSaved }: any) {
  const [loading, setLoading] = useState(true);
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [points, setPoints] = useState<TestPoint[]>([]);

  useEffect(() => {
    async function load() {
      const [caseRes, pointsRes] = await Promise.all([
        fetch(`http://localhost:4000/api/test_cases/${testCaseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:4000/api/test_case_points/${testCaseId}/points`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const caseData = await caseRes.json();
      const pointsData = await pointsRes.json();
      console.log("Fetched points:", pointsData);
      setTestCase(caseData);
      setPoints(pointsData);
      setLoading(false);
    }
    load();
  }, [testCaseId]);

  function addPoint() {
    setPoints((prev) => [
      ...prev,
      { id: "new", description: "", position: prev.length + 1 },
    ]);
  }

  function updatePoint(index: number, value: string) {
    setPoints((prev) =>
      prev.map((p, i) => (i === index ? { ...p, description: value } : p))
    );
  }

  function deletePoint(index: number) {
    setPoints((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
  if (!testCase) return;

  await fetch(`http://localhost:4000/api/test_cases/${testCaseId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(testCase),
  });

  const updatedPoints = [...points];

  for (let i = 0; i < updatedPoints.length; i++) {
    const point = updatedPoints[i];

    if (point.id === "new") {
      const res = await fetch(`http://localhost:4000/api/test_case_points`, {
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
      });

      const newPoint = await res.json();
      updatedPoints[i].id = newPoint.id;
    } else {
      await fetch(`http://localhost:4000/api/test_case_points/${point.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: point.description,
          position: i + 1,
        }),
      });
    }
  }

  setPoints(updatedPoints);

  const original = await fetch(`http://localhost:4000/api/test_case_points/${testCaseId}/points`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  const existingIds = updatedPoints.filter((p) => p.id !== "new").map((p) => p.id);

  for (const p of original) {
    if (!existingIds.includes(p.id)) {
      await fetch(`http://localhost:4000/api/test_case_points/${p.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }

  onSaved?.();
}


  if (loading) return <div>Ładowanie...</div>;

  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Edytuj test case</h2>

      <input
        value={testCase!.title}
        onChange={(e) =>
          setTestCase((prev) => ({ ...prev!, title: e.target.value }))
        }
        className="w-full border p-2 rounded"
      />

      <textarea
        value={testCase!.description}
        onChange={(e) =>
          setTestCase((prev) => ({ ...prev!, description: e.target.value }))
        }
        className="w-full border p-2 rounded"
      />

      <textarea
        value={testCase!.expected_result}
        onChange={(e) =>
          setTestCase((prev) => ({ ...prev!, expected_result: e.target.value }))
        }
        className="w-full border p-2 rounded"
      />

      <div>
        <h3 className="font-semibold mb-2">Punkty testowe</h3>

        {points.map((p, index) => (
          <div key={p.id + "-" + index} className="flex gap-2 mb-2 items-center">
            <span>{index + 1}.</span>
            <input
              value={p.description}
              onChange={(e) => updatePoint(index, e.target.value)}
              className="flex-1 border p-2 rounded"
            />
            <button
              type="button"
              onClick={() => deletePoint(index)}
              className="text-red-500 hover:text-red-700"
            >
              delete
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addPoint}
          className="mt-2 px-3 py-1 bg-green-500 text-white rounded"
        >
          Dodaj punkt
        </button>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2 bg-blue-600 text-white rounded"
      >
        Zapisz zmiany
      </button>
    </div>
  );
}
