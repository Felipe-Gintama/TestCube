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

export default function AddTestCaseForm({ token, groupId, onSaved }: any) {

    const [testCase, setTestCase] = useState<TestCase>({
        id: 0,
        title: "",
        description: "",
        expected_result: ""
    });

    const [points, setPoints] = useState<TestPoint[]>([]);

    function addPoint() {
    setPoints(prev => [
      ...prev,
      { id: "new", description: "", position: prev.length + 1 }
    ]);
  }

  function updatePoint(index: number, value: string) {
    setPoints(prev =>
      prev.map((p, i) => (i === index ? { ...p, description: value } : p))
    );
  }

  function deletePoint(index: number) {
    setPoints(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    // ----------------------
    // 1. Utwórz test case
    // ----------------------
    const res = await fetch(`http://localhost:4000/api/test_cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        group_id: groupId,
        title: testCase.title,
        description: testCase.description,
        expected_result: testCase.expected_result
      })
    });

    const newTest = await res.json();

    // ----------------------
    // 2. Zapisz punkty testowe
    // ----------------------
    for (let i = 0; i < points.length; i++) {
      await fetch(`http://localhost:4000/api/test_case_points`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          test_case_id: newTest.id,
          description: points[i].description,
          position: i + 1
        })
      });
    }

    // ----------------------
    // 3. Zgłoś do rodzica że utworzono test
    // ----------------------
    onSaved?.(newTest);
  }

    return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-bold">Dodaj nowy test</h2>

      <input
        placeholder="Tytuł testu"
        value={testCase.title}
        onChange={e => setTestCase(prev => ({ ...prev, title: e.target.value }))}
        className="w-full border p-2 rounded"
      />

      <textarea
        placeholder="Opis"
        value={testCase.description}
        onChange={e =>
          setTestCase(prev => ({ ...prev, description: e.target.value }))
        }
        className="w-full border p-2 rounded"
      />

      <textarea
        placeholder="Oczekiwany rezultat"
        value={testCase.expected_result}
        onChange={e =>
          setTestCase(prev => ({ ...prev, expected_result: e.target.value }))
        }
        className="w-full border p-2 rounded"
      />

      <div>
        <h3 className="font-semibold mb-2">Punkty testowe</h3>

        {points.map((p, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center">
            <span>{index + 1}.</span>
            <input
              value={p.description}
              onChange={e => updatePoint(index, e.target.value)}
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
        Zapisz nowy test
      </button>
    </div>
  );
}