import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

interface TestCase {
  id: number;
  title: string;
}
interface TestGroupNode {
  id: number;
  name: string;
  children: TestGroupNode[];
  cases: TestCase[];
}
interface PlanCase {
  id: number; // lokalny unikalny ID
  testCaseId: number;
  title: string;
  position: number;
}

interface Project {
  id: number;
  name: string;
}
interface Release {
  id: number;
  projectId: number;
  version: string;
}
interface Plan {
  id: number;
  releaseId: number;
  name: string;
}

export default function TestPlanPrototype() {
  // ⭐ PROJEKTY
  const [projects] = useState<Project[]>([
    { id: 1, name: "CRM App" },
    { id: 2, name: "Mobile Banking" },
  ]);
  const [activeProjectId, setProject] = useState<number | null>(1);

  // ⭐ WYDANIA
  const [releases] = useState<Release[]>([
    { id: 10, projectId: 1, version: "2.0" },
    { id: 11, projectId: 1, version: "2.1" },
    { id: 20, projectId: 2, version: "1.4" },
    { id: 21, projectId: 2, version: "2.0" },
  ]);
  const [activeReleaseId, setRelease] = useState<number | null>(null);

  // ⭐ PLANY
  const [plans, setPlans] = useState<Plan[]>([
    { id: 100, releaseId: 10, name: "Regression v2" },
    { id: 101, releaseId: 10, name: "Smoke tests" },
    { id: 200, releaseId: 21, name: "Payments tests" },
  ]);
  const [activePlanId, setPlan] = useState<number | null>(null);

  // ⭐ DRZEWO PRZYPADKÓW
  const [tree] = useState<TestGroupNode[]>([
    {
      id: 1,
      name: "UI",
      children: [],
      cases: [
        { id: 1001, title: "Login ok" },
        { id: 1002, title: "Sidebar visible" },
      ],
    },
    {
      id: 2,
      name: "API",
      children: [],
      cases: [
        { id: 2001, title: "POST /payment" },
        { id: 2002, title: "Auth refresh" },
      ],
    },
  ]);

  // ⭐ TESTY W PLANIE
  const [planCases, setPlanCases] = useState<PlanCase[]>([]);

  // ---------------------------- Dodawanie / usuwanie testów
  function addCase(test: TestCase) {
    if (!activePlanId) return;
    if (planCases.some((p) => p.testCaseId === test.id)) return;

    setPlanCases((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        testCaseId: test.id,
        title: test.title,
        position: prev.length + 1,
      },
    ]);
  }

  function removeCase(id: number) {
    setPlanCases((prev) =>
      prev
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, position: i + 1 }))
    );
  }

  // ---------------------------- Drag&Drop
  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const updated = Array.from(planCases);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    setPlanCases(updated.map((p, i) => ({ ...p, position: i + 1 })));
  }

  // ---------------------------- Klonowanie planu
  function clonePlan(planId: number) {
    if (!activeReleaseId) return;
    const originalPlan = plans.find((p) => p.id === planId);
    if (!originalPlan) return;

    const newPlanId = Date.now();
    const clonedCases = planCases.map((pc) => ({
      ...pc,
      id: Date.now() + Math.random(),
    }));

    const newPlan: Plan = {
      id: newPlanId,
      releaseId: activeReleaseId,
      name: `Clone of ${originalPlan.name}`,
    };

    setPlans((prev) => [...prev, newPlan]);
    setPlan(newPlanId);
    setPlanCases(clonedCases);
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* PANEL 1 — PROJEKT */}
      <aside className="w-56 bg-gray-200 p-4">
        <h3 className="font-bold mb-2">Projects</h3>
        {projects.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              setProject(p.id);
              setRelease(null);
              setPlan(null);
              setPlanCases([]);
            }}
            className={`cursor-pointer p-2 mb-1 rounded ${
              activeProjectId === p.id
                ? "bg-blue-500 text-white"
                : "hover:bg-gray-300"
            }`}
          >
            {p.name}
          </div>
        ))}
      </aside>

      {/* PANEL 2 — WYDANIE */}
      <aside className="w-56 bg-gray-150 p-4 border-l">
        <h3 className="font-bold mb-2">Releases</h3>
        {releases
          .filter((r) => r.projectId === activeProjectId)
          .map((r) => (
            <div
              key={r.id}
              onClick={() => {
                setRelease(r.id);
                setPlan(null);
                setPlanCases([]);
              }}
              className={`cursor-pointer p-2 mb-1 rounded ${
                activeReleaseId === r.id
                  ? "bg-green-500 text-white"
                  : "hover:bg-gray-300"
              }`}
            >
              {r.version}
            </div>
          ))}
      </aside>

      {/* PANEL 3 — PLANY */}
      <aside className="w-56 bg-gray-150 p-4 border-l">
        <h3 className="font-bold mb-2">Plans</h3>
        {plans
          .filter((p) => p.releaseId === activeReleaseId)
          .map((p) => (
            <div
              key={p.id}
              className={`cursor-pointer p-2 mb-1 rounded flex justify-between items-center ${
                activePlanId === p.id ? "bg-purple-500 text-white" : "hover:bg-gray-300"
              }`}
            >
              <span
                onClick={() => {
                  setPlan(p.id);
                  setPlanCases([]); // nowy plan → czysty snapshot
                }}
              >
                {p.name}
              </span>
              <button
                className="px-2 py-1 bg-yellow-500 text-white rounded ml-2"
                onClick={() => clonePlan(p.id)}
              >
                Clone
              </button>
            </div>
          ))}
      </aside>

      {/* PANEL 4 — DRZEWO przypadków */}
      <main className="flex-1 p-4 overflow-y-auto border-l bg-white">
        <h3 className="font-bold">Test Cases Library</h3>

        {!activePlanId && (
          <div className="text-gray-400 mt-6">
            🔔 Wybierz plan, aby dodawać testy
          </div>
        )}

        {activePlanId &&
          tree.map((group) => (
            <div key={group.id} className="mt-4">
              <div className="font-semibold text-lg">{group.name}</div>
              <ul className="pl-4">
                {group.cases.map((tc) => (
                  <li
                    key={tc.id}
                    className="flex justify-between items-center py-1"
                  >
                    {tc.title}
                    <button
                      className="px-2 py-1 bg-green-500 text-white rounded"
                      onClick={() => addCase(tc)}
                    >
                      +
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </main>

      {/* PANEL 5 — Plan content */}
      <aside className="w-96 p-4 bg-gray-50 border-l overflow-y-auto">
        <h3 className="font-bold mb-2">Plan Content</h3>

        {planCases.length === 0 && (
          <div className="text-gray-400">No test cases in plan</div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="planCases">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef}>
                {planCases.map((tc, index) => (
                  <Draggable
                    key={tc.id}
                    draggableId={tc.id.toString()}
                    index={index}
                  >
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="flex justify-between items-center p-2 border rounded bg-white mb-1"
                      >
                        <span>
                          {tc.position}. {tc.title}
                        </span>
                        <button
                          className="px-2 py-1 bg-red-500 text-white rounded"
                          onClick={() => removeCase(tc.id)}
                        >
                          X
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </aside>
    </div>
  );
}
