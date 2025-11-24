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
}

export default function EditTestCaseForm({ testCaseId, token, groupId, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [testCase, setTestCase] = useState<TestCase | null>(null);
  const [points, setPoints] = useState<TestPoint[]>([]);

  useEffect(() => {
    if (!token) return;

    if (testCaseId === null) {

      setTestCase({ id: 0, title: "", description: "", expected_result: "" });
      setPoints([]);
      setLoading(false);
      return;
    }

    async function load() {
      try {
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

        setTestCase(caseData);
        setPoints(Array.isArray(pointsData) ? pointsData : []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }
    load();
  }, [testCaseId, token]);

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
    if (!token || !testCase) return;

    if (testCaseId === null) {

      const res = await fetch(`http://localhost:4000/api/test_cases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: testCase.title || "Nowy test",
          description: testCase.description,
          expected_result: testCase.expected_result,
          project_id: 1,
          group_id: groupId
        }),
      });

      console.log(groupId);

      const newTest: TestCase = await res.json();
      
      onSaved?.(newTest);
      return;
    }


    await fetch(`http://localhost:4000/api/test_cases/${testCaseId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(testCase),
    });

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
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
        points[i].id = newPoint.id;
      } else {
        await fetch(`http://localhost:4000/api/test_case_points/${point.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description: point.description, position: i + 1 }),
        });
      }
    }

    onSaved?.(testCase);
  }

  if (loading) return <div>Ładowanie...</div>;
  if (!testCase) return null;

  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-bold">{testCaseId === null ? "Nowy test" : "Edytuj test"}</h2>

      <input
        value={testCase.title}
        onChange={(e) => setTestCase((prev) => ({ ...prev!, title: e.target.value }))}
        className="w-full border p-2 rounded"
        placeholder="Tytuł testu"
      />
      <textarea
        value={testCase.description}
        onChange={(e) => setTestCase((prev) => ({ ...prev!, description: e.target.value }))}
        className="w-full border p-2 rounded"
        placeholder="Opis testu"
      />
      <textarea
        value={testCase.expected_result}
        onChange={(e) =>
          setTestCase((prev) => ({ ...prev!, expected_result: e.target.value }))
        }
        className="w-full border p-2 rounded"
        placeholder="Oczekiwany wynik"
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
        <button type="button" onClick={addPoint} className="mt-2 px-3 py-1 bg-green-500 text-white rounded">
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
