import { useCallback, useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import type { TestCaseItem, TestGroupNode } from "../types/testTree";

/**
 * Test Plan Manager - wyczyszczona wersja
 * Zachowano endpointy http://localhost:4000/api/...
 */

/* ----------------------------- Types ----------------------------- */
export interface PlanCases {
  plan_case_id: number;
  test_case_id: number;
  title: string;
  description: string;
  expected_result: string;
  group_id: number;
  position: number;
}

interface TestCase {
  id: number;
  title: string;
}

interface PlanCase {
  id: number; // DB id (test_plan_cases.id)
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
  // fields coming from backend (may vary)
  name: string;
  description?: string;
  project_id?: number;
  created_by?: number;
  created_at?: string;
}

/** Nowa struktura: plans pogrupowane po release */
interface ReleaseGroup {
  releaseId: number;
  releaseVersion: string;
  plans: Plan[];
}

/* ----------------------------- Helpers ----------------------------- */
function buildTreeFromCases(cases: TestCaseItem[]): TestGroupNode[] {
  const groupsMap: Record<number, TestGroupNode> = {};

  cases.forEach((tc) => {
    if (!tc.group_id) return;

    if (!groupsMap[tc.group_id]) {
      groupsMap[tc.group_id] = {
        id: tc.group_id,
        name: `Group ${tc.group_id}`,
        parent_id: null,
        cases: [],
        children: [],
      };
    }

    groupsMap[tc.group_id].cases.push(tc);
  });

  return Object.values(groupsMap);
}

function TreeNode({ node, addCaseToPlan }: { node: TestGroupNode; addCaseToPlan: (tc: TestCase) => void }) {
  return (
    <div className="mb-2 pl-4 border-l">
      <div className="font-semibold">{node.name}</div>

      {node.cases.length > 0 && (
        <ul className="pl-4 mt-1 space-y-1">
          {node.cases.map((tc) => (
            <li key={tc.id} className="flex justify-between items-center hover:bg-gray-100">
              <span>{tc.title}</span>
              <button
                className="text-white bg-green-600 px-2 py-0.5 rounded cursor-pointer"
                onClick={() => addCaseToPlan(tc)}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}

      {node.children.map((child) => (
        <TreeNode key={child.id} node={child} addCaseToPlan={addCaseToPlan} />
      ))}
    </div>
  );
}

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

/* ----------------------------- Component ----------------------------- */
export default function TestPlanManager() {
  // Projects / Releases / Plans
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [releases, setReleases] = useState<Release[]>([]);
  const [activeReleaseId, setActiveReleaseId] = useState<number | null>(null);

  const [plans, setPlans] = useState<ReleaseGroup[]>([]); // <- groups per release
  const [activePlanId, setActivePlanId] = useState<number | null>(null);

  // Tree of test cases (library)
  const [tree, setTree] = useState<TestGroupNode[]>([]);

  // Plan cases (right panel)
  const [planCases, setPlanCases] = useState<PlanCase[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Inline create inputs
  const [newReleaseVersion, setNewReleaseVersion] = useState("");
  const [newPlanName, setNewPlanName] = useState("");

  /* ----------------------------- Initial load: projects ----------------------------- */
  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const data = await apiFetch("http://localhost:4000/api/projects");
        setProjects(data);
        if (data.length > 0) {
          setActiveProjectId((prev) => prev ?? data[0].id);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  /* ----------------------------- Load releases when project changes ----------------------------- */
  useEffect(() => {
    if (!activeProjectId) {
      setReleases([]);
      setActiveReleaseId(null);
      return;
    }

    async function loadReleases() {
      try {
        setLoading(true);
        // GET /api/releases/:projectId
        const data = await apiFetch(`http://localhost:4000/api/releases/${activeProjectId}`);
        setReleases(data);
        // keep previous activeRelease if still present else pick first
        setActiveReleaseId((prev) => (data.find((r: Release) => r.id === prev) ? prev : data[0]?.id ?? null));
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadReleases();
    // reset downstream
    setPlans([]);
    setActivePlanId(null);
    setPlanCases([]);
  }, [activeProjectId]);

  /* ----------------------------- Load plans grouped by releases when project changes ----------------------------- */
  useEffect(() => {
    if (!activeProjectId) {
      setPlans([]);
      return;
    }

    async function loadPlansGrouped() {
      try {
        setLoading(true);
        // Endpoint expected to return grouped plans for project:
        // GET /api/test_plans/:projectId  (your service returns rows grouped by release)
        const data = await apiFetch(`http://localhost:4000/api/test_plans/${activeProjectId}`);
        // data is expected to be: [{ releaseId, releaseVersion, plans: [...] }, ...]
        // Defensive: if backend returns flat list (older variant), convert it
        if (Array.isArray(data) && data.length > 0) {
          if (data[0].releaseId !== undefined && Array.isArray(data[0].plans)) {
            // already grouped
            setPlans(data);
          } else {
            // fallback: backend returned flat list with release_id/release_version on each row
            const grouped = (data as any[]).reduce((acc: Record<number, ReleaseGroup>, row: any) => {
              const rid = row.release_id;
              if (!acc[rid]) {
                acc[rid] = { releaseId: rid, releaseVersion: row.release_version ?? `Release ${rid}`, plans: [] };
              }
              acc[rid].plans.push({
                id: row.id,
                name: row.name,
                description: row.description,
                project_id: row.project_id,
                created_by: row.created_by,
                created_at: row.created_at
              });
              return acc;
            }, {});
            setPlans(Object.values(grouped));
          }
        } else {
          setPlans([]);
        }

        // optionally set active plan to first plan of activeReleaseId (if any)
        if (activeReleaseId) {
          const rg = (data as any[]).find((g: any) => g.releaseId === activeReleaseId || g.release_id === activeReleaseId);
          const firstPlan = rg?.plans?.[0] ?? null;
          setActivePlanId(firstPlan?.id ?? null);
        } else {
          // if no active release chosen, pick first available plan
          const firstGroup = (data && data[0]) ? data[0] : null;
          const firstPlan = firstGroup?.plans?.[0];
          setActivePlanId(firstPlan?.id ?? null);
        }
      } catch (err: any) {
        console.error("loadPlansGrouped error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPlansGrouped();
    setPlanCases([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId]);

  /* ----------------------------- Load test-cases tree for project ----------------------------- */
  useEffect(() => {
    if (!activeProjectId) {
      setTree([]);
      return;
    }

    async function loadTree() {
      try {
        setLoading(true);
        const data: TestCaseItem[] = await apiFetch(`http://localhost:4000/api/test_cases/${activeProjectId}/all`);
        setTree(buildTreeFromCases(data));
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadTree();
  }, [activeProjectId]);

  /* ----------------------------- Load planCases when plan changes ----------------------------- */
  const loadPlanCases = useCallback(async () => {
    if (!activePlanId) {
      setPlanCases([]);
      return;
    }
    try {
      setLoading(true);
      const data: PlanCases[] = await apiFetch(`http://localhost:4000/api/test_plan_cases/${activePlanId}`);
      const normalized: PlanCase[] = data
        .map((item) => ({
          id: item.plan_case_id,
          testCaseId: item.test_case_id,
          title: item.title,
          position: item.position,
        }))
        .sort((a, b) => a.position - b.position);
      setPlanCases(normalized);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activePlanId]);

  useEffect(() => {
    loadPlanCases();
  }, [activePlanId, loadPlanCases]);

  /* ----------------------------- CRUD: Releases ----------------------------- */
  async function createRelease() {
    if (!activeProjectId || !newReleaseVersion.trim()) return;
    try {
      setLoading(true);
      const body = {
        projectId: activeProjectId,
        version: newReleaseVersion.trim(),
        description: "",
        releasedAt: null,
      };

      const created = await apiFetch(`http://localhost:4000/api/releases/new`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setReleases((r) => [created, ...r]);
      setNewReleaseVersion("");
      setMessage("Release created");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteRelease(releaseId: number) {
    if (!confirm("Are you sure you want to delete this release?")) return;
    try {
      setLoading(true);
      await apiFetch(`http://localhost:4000/api/releases/${releaseId}`, { method: "DELETE" });
      setReleases((prev) => prev.filter((r) => r.id !== releaseId));
      if (activeReleaseId === releaseId) {
        setActiveReleaseId(null);
        setPlans([]);
        setActivePlanId(null);
      }
      setMessage("Release deleted");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------- CRUD: Plans ----------------------------- */
  async function createPlan() {
    if (!activeReleaseId || !newPlanName.trim()) return;

    try {
      setLoading(true);
      // POST /api/test_plans/new/:releaseId
      const created: Plan = await apiFetch(`http://localhost:4000/api/test_plans/new/${activeReleaseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlanName.trim(), description: "" }),
      });

      // Insert created plan into proper release group in local state
      setPlans((prev) => {
        const idx = prev.findIndex((rg) => rg.releaseId === activeReleaseId);
        if (idx !== -1) {
          const newGroups = [...prev];
          newGroups[idx] = { ...newGroups[idx], plans: [created, ...newGroups[idx].plans] };
          return newGroups;
        } else {
          // if group not found, create it using releases to find version
          const rel = releases.find((r) => r.id === activeReleaseId);
          const newGroup: ReleaseGroup = {
            releaseId: activeReleaseId,
            releaseVersion: rel?.version ?? `Release ${activeReleaseId}`,
            plans: [created],
          };
          return [newGroup, ...prev];
        }
      });

      setNewPlanName("");
      setActivePlanId(created.id);
      setMessage("Plan created");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePlan(planId: number) {
    if (!confirm("Delete plan? This cannot be undone if the plan has runs.")) return;
    try {
      setLoading(true);
      await apiFetch(`http://localhost:4000/api/test_plans/${planId}`, { method: "DELETE" });
      // remove from groups
      setPlans((prev) =>
        prev
          .map((g) => ({ ...g, plans: g.plans.filter((p) => p.id !== planId) }))
          .filter((g) => g.plans.length > 0) // optional: remove empty release group
      );
      if (activePlanId === planId) {
        setActivePlanId(null);
        setPlanCases([]);
      }
      setMessage("Plan deleted");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function clonePlan(planId: number) {
    if (!activeReleaseId) {
      setError("No active release selected");
      return;
    }
    if (!confirm("Clone this plan into the current release?")) return;

    try {
      setLoading(true);
      // POST /api/test_plans/:planId/clone with body { releaseId }
      const cloned: any = await apiFetch(`http://localhost:4000/api/test_plans/${planId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ releaseId: activeReleaseId }),
      });

      // cloned is expected to be new plan object (service returns { ...newPlan, testCases: [...] } in your service)
      // Insert into proper release group
      setPlans((prev) => {
        const idx = prev.findIndex((rg) => rg.releaseId === activeReleaseId);
        if (idx !== -1) {
          const newGroups = [...prev];
          newGroups[idx] = { ...newGroups[idx], plans: [cloned, ...newGroups[idx].plans] };
          return newGroups;
        } else {
          // create new group if needed (find release version if possible)
          const rel = releases.find((r) => r.id === activeReleaseId);
          const newGroup: ReleaseGroup = {
            releaseId: activeReleaseId,
            releaseVersion: rel?.version ?? `Release ${activeReleaseId}`,
            plans: [cloned],
          };
          return [newGroup, ...prev];
        }
      });

      setActivePlanId(cloned.id);
      setMessage("Plan cloned successfully");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------- Plan cases operations ----------------------------- */
  async function addCaseToPlan(testCase: TestCase) {
    if (!activePlanId) return;
    try {
      setLoading(true);
      const created: PlanCase = await apiFetch("http://localhost:4000/api/test_plan_cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPlanId: activePlanId, testCaseId: testCase.id }),
      });
      setPlanCases((prev) => [...prev, created].sort((a, b) => a.position - b.position));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeCaseFromPlan(testCaseId: number) {
    if (!confirm("Delete test from plan?")) return;
    if (!activePlanId) return;
    try {
      setLoading(true);
      await apiFetch(`http://localhost:4000/api/test_plan_cases`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPlanId: activePlanId, testCaseId }),
      });
      await loadPlanCases();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------- Reorder handling (drag&drop) ----------------------------- */
  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const updated = Array.from(planCases);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    const reindexed = updated.map((p, i) => ({ ...p, position: i + 1 }));
    setPlanCases(reindexed);

    try {
      await apiFetch("/api/plan_cases/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planCases: reindexed.map((p) => ({ id: p.id, position: p.position })) }),
      });
    } catch (err: any) {
      console.error("Reorder failed:", err);
      setError("Failed to persist new order. It will be refreshed.");
      if (activePlanId) {
        try {
          const data: PlanCase[] = await apiFetch(`/api/plan_cases?planId=${activePlanId}`);
          setPlanCases(data.sort((a, b) => a.position - b.position));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }

  /* ----------------------------- UI Rendering ----------------------------- */
  return (
    <div className="flex h-screen bg-gray-100 text-sm">
      {/* LEFT: Projects */}
      <aside className="w-56 bg-white p-4 border-r overflow-auto">
        <h3 className="font-bold mb-3">Projects</h3>
        {loading && projects.length === 0 ? (
          <div>Loading projects...</div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setActiveProjectId(p.id);
                setActiveReleaseId(null);
                setActivePlanId(null);
                setPlanCases([]);
              }}
              className={`cursor-pointer p-2 mb-1 rounded ${activeProjectId === p.id ? "bg-blue-500 text-white" : "hover:bg-gray-50"}`}
            >
              {p.name}
            </div>
          ))
        )}
      </aside>

      {/* LEFT-MIDDLE: Releases */}
      <aside className="w-56 bg-gray-50 p-4 border-r overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Releases</h3>
        </div>

        <div className="mb-2">
          <input
            className="w-full border p-1 rounded mb-1"
            placeholder="New version (e.g. 2.3.0)"
            value={newReleaseVersion}
            onChange={(e) => setNewReleaseVersion(e.target.value)}
          />
          <button
            onClick={createRelease}
            className="w-full bg-green-600 text-white py-1 rounded cursor-pointer"
          >
            Add Release
          </button>
        </div>

        {loading && releases.length === 0 ? (
          <div>Loading releases...</div>
        ) : (
          releases.map((r) => (
            <div key={r.id} className="mb-2">
              <div
                onClick={() => {
                  setActiveReleaseId(r.id);
                  // when user selects release, set active plan to first plan of that release (if exists)
                  const group = plans.find((g) => g.releaseId === r.id);
                  setActivePlanId(group?.plans?.[0]?.id ?? null);
                  setPlanCases([]);
                }}
                className={`flex justify-between items-center p-2 rounded ${activeReleaseId === r.id ? "bg-green-500 text-white" : "hover:bg-gray-100"}`}
              >
                <div>{r.version}</div>
                <button className="px-2 py-0.5 bg-red-500 text-white rounded cursor-pointer" onClick={() => deleteRelease(r.id)}>Del</button>
              </div>
            </div>
          ))
        )}
      </aside>

      {/* MIDDLE: Plans (grouped by release) */}
      <aside className="w-56 bg-gray-50 p-4 border-r overflow-auto">
        <h3 className="font-bold mb-3">Plans</h3>

        <div className="mb-2">
          <input
            className="w-full border p-1 rounded mb-1"
            placeholder="New plan name"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
          />
          <button onClick={createPlan} className="w-full bg-indigo-600 text-white py-1 rounded">Add Plan</button>
        </div>

        {/* Render grouped plans safely */}
        {plans.length === 0 && <div className="text-gray-500">No plans for this project</div>}

        {plans.map((releaseGroup) => (
          <div key={releaseGroup.releaseId} className="mb-4">
            <div className="font-bold mb-2">{releaseGroup.releaseVersion}</div>

            {(Array.isArray(releaseGroup.plans) && releaseGroup.plans.length > 0) ? (
              releaseGroup.plans.map((p) => (
                <div
                  key={p.id}
                  className={`flex justify-between items-center p-2 mb-1 rounded ${activePlanId === p.id ? "bg-purple-500 text-white" : "hover:bg-gray-100"}`}
                >
                  <span onClick={() => { setActivePlanId(p.id); }}>{p.name}</span>
                  <div className="flex gap-2">
                    <button className="px-2 py-0.5 bg-yellow-500 text-white rounded" onClick={() => clonePlan(p.id)}>Clone</button>
                    <button className="px-2 py-0.5 bg-red-500 text-white rounded" onClick={() => deletePlan(p.id)}>Del</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400">No plans in this release</div>
            )}
          </div>
        ))}
      </aside>

      {/* MIDDLE-RIGHT: Test Cases Library */}
      <main className="flex-1 p-4 overflow-auto bg-white">
        <h3 className="font-bold mb-3">Test Cases Library</h3>

        {!activePlanId && <div className="text-gray-400">Select a plan to add tests</div>}

        {activePlanId && tree.length === 0 && (
          <div className="text-gray-400">No test cases in library for this project</div>
        )}

        {activePlanId && Array.isArray(tree) && tree.map((group) => (
          <TreeNode key={group.id} node={group} addCaseToPlan={addCaseToPlan} />
        ))}
      </main>

      {/* RIGHT: Plan Content */}
      <aside className="w-96 p-4 bg-gray-50 border-l overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Plan Content</h3>
          <div className="text-xs text-gray-500">Plan ID: {activePlanId ?? "-"}</div>
        </div>

        {planCases.length === 0 && <div className="text-gray-400">No tests in plan</div>}

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="planCases">
            {(provided) => (
              <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {planCases.map((tc, index) => (
                  <Draggable key={tc.id} draggableId={tc.id.toString()} index={index}>
                    {(prov) => (
                      <li
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className="flex justify-between items-center p-2 border rounded bg-white"
                      >
                        <div>
                          <div className="text-sm font-medium">{index + 1}. {tc.title}</div>
                          <div className="text-xs text-gray-500">pos: {tc.position} • id: {tc.id}</div>
                        </div>
                        <div className="flex gap-2">
                          <button className="px-2 py-0.5 bg-red-500 text-white rounded" onClick={() => removeCaseFromPlan(tc.id)}>Remove</button>
                        </div>
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

      {/* bottom notifications */}
      <div className="fixed bottom-4 left-4">
        {message && <div className="bg-green-600 text-white px-4 py-2 rounded shadow">{message}</div>}
        {error && <div className="bg-red-600 text-white px-4 py-2 rounded shadow mt-2">{error}</div>}
      </div>
    </div>
  );
}
















//------------------------------------------------------------POPRAWKA------------------------------------------------------------------------------------------------------


// import { useCallback, useEffect, useState, version } from "react";
// import {
//   DragDropContext,
//   Droppable,
//   Draggable,
//   type DropResult,
// } from "@hello-pangea/dnd";

// import type { TestCaseItem, TestGroupNode } from "../types/testTree";

// /**
//  * Test Plan Manager - refaktoryzowany, "production-ish" prototyp
//  *
//  * Uwaga: dostosuj endpointy pod swój backend jeśli różnią się od przyjętych w kodzie.
//  */

// export interface PlanCases {
//   plan_case_id: number;
//   test_case_id: number;
//   title: string;
//   description: string;
//   expected_result: string;
//   group_id: number;
//   position: number;
// }

// function buildTreeFromCases(cases: TestCaseItem[]): TestGroupNode[] {
//   const groupsMap: Record<number, TestGroupNode> = {};

//   cases.forEach((tc) => {
//     if (!tc.group_id) return; // jeśli brak group_id, pomijamy

//     if (!groupsMap[tc.group_id]) {
//       groupsMap[tc.group_id] = {
//         id: tc.group_id,
//         name: `Group ${tc.group_id}`, // jeśli nie masz nazwy grupy w API
//         parent_id: null,
//         cases: [],
//         children: [],
//       };
//     }

//     groupsMap[tc.group_id].cases.push(tc);
//   });

//   return Object.values(groupsMap);
// }


// /* ----------------------------- Types ----------------------------- */
// interface TestCase {
//   id: number;
//   title: string;
// }


// interface PlanCase {
//   id: number; // DB id (test_plan_cases.id)
//   testCaseId: number;
//   title: string;
//   position: number;
// }

// interface Project {
//   id: number;
//   name: string;
// }
// interface Release {
//   id: number;
//   projectId: number;
//   version: string;
// }
// interface Plan {
//   id: number;
//   releaseId: number;
//   name: string;
// }
// function TreeNode({ node, addCaseToPlan }: { node: TestGroupNode; addCaseToPlan: (tc: TestCase) => void }) {
//   return (
//     <div className="mb-2 pl-4 border-l">
//       <div className="font-semibold">{node.name}</div>

//       {node.cases.length > 0 && (
//         <ul className="pl-4 mt-1 space-y-1">
//           {node.cases.map((tc) => (
//             <li key={tc.id} className="flex justify-between items-center">
//               <span>{tc.title}</span>
//               <button
//                 className="text-white bg-green-600 px-2 py-0.5 rounded"
//                 onClick={() => addCaseToPlan(tc)}
//               >
//                 Add
//               </button>
//             </li>
//           ))}
//         </ul>
//       )}

//       {node.children.map((child) => (
//         <TreeNode key={child.id} node={child} addCaseToPlan={addCaseToPlan} />
//       ))}
//     </div>
//   );
// }

// /* ----------------------------- Helpers ----------------------------- */
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

// /* ----------------------------- Component ----------------------------- */
// export default function TestPlanManager() {
//   // Projects / Releases / Plans
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

//   const [releases, setReleases] = useState<Release[]>([]);
//   const [activeReleaseId, setActiveReleaseId] = useState<number | null>(null);

//   const [plans, setPlans] = useState<Plan[]>([]);
//   const [activePlanId, setActivePlanId] = useState<number | null>(null);

//   // Tree of test cases (library)
//   const [tree, setTree] = useState<TestGroupNode[]>([]);

//   // Plan cases (right panel)
//   const [planCases, setPlanCases] = useState<PlanCase[]>([]);

//   // UI state
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState<string | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   // Inline create inputs
//   const [newReleaseVersion, setNewReleaseVersion] = useState("");
//   const [newPlanName, setNewPlanName] = useState("");

//   /* ----------------------------- Initial load: projects ----------------------------- */
//   useEffect(() => {
//     async function loadProjects() {
//       try {
//         setLoading(true);
//         const data = await apiFetch("http://localhost:4000/api/projects");
//         setProjects(data);
//         if (data.length > 0) {
//           // optionally auto-select first project
//           setActiveProjectId((prev) => prev ?? data[0].id);
//         }
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
//     loadProjects();
//   }, []);

//   /* ----------------------------- Load releases when project changes ----------------------------- */
//   useEffect(() => {
//     if (!activeProjectId) {
//       setReleases([]);
//       setActiveReleaseId(null);
//       return;
//     }

//     async function loadReleases() {
//       try {
//         setLoading(true);
//         // Endpoint: GET /api/projects/:projectId/releases
//         const data = await apiFetch(`http://localhost:4000/api/releases/${activeProjectId}`);
//         console.log(data);
//         setReleases(data);
//         setActiveReleaseId((prev) => (data.find((r: Release) => r.id === prev) ? prev : data[0]?.id ?? null));
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadReleases();
//     // reset downstream
//     setPlans([]);
//     setActivePlanId(null);
//     setPlanCases([]);
//   }, [activeProjectId]);

//   /* ----------------------------- Load plans when release changes ----------------------------- */
//   useEffect(() => {
//     if (!activeReleaseId) {
//       setPlans([]);
//       setActivePlanId(null);
//       return;
//     }

//     // async function loadPlans() {
//     //   try {
//     //     setLoading(true);
//     //     // Endpoint: GET /api/releases/:releaseId/plans (or /api/plans?releaseId=..)
//     //     const data = await apiFetch(`http://localhost:4000/api/test_plans/${activeReleaseId}/plans`);
//     //     setPlans(data);
//     //     setActivePlanId((prev) => (data.find((p: Plan) => p.id === prev) ? prev : data[0]?.id ?? null));
//     //   } catch (err: any) {
//     //     console.error(err);
//     //     setError(err.message);
//     //   } finally {
//     //     setLoading(false);
//     //   }
//     // }
//     async function loadPlans() {
//     try {
//       setLoading(true);
//       // Pobieramy wszystkie plany dla projektu, pogrupowane po release
//       const data = await apiFetch(`http://localhost:4000/api/test_plans/${activeProjectId}`);
//       console.log("Grouped plans:", data);
//       setPlans(data);
//       // Opcjonalnie: ustaw pierwszy plan z pierwszego release jako aktywny
//       setActivePlanId(data[0]?.plans[0]?.id ?? null);
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//     loadPlans();
//     setPlanCases([]);
//   }, [activeReleaseId]);

//   /* ----------------------------- Load test-cases tree for project ----------------------------- */
//   // useEffect(() => {
//   //   if (!activeProjectId) {
//   //     setTree([]);
//   //     return;
//   //   }

//   //   async function loadTree() {
//   //     try {
//   //       // Endpoint assumptions: GET /api/test_cases?projectId=...
//   //       setLoading(true);
//   //       const data = await apiFetch(`http://localhost:4000/api/test_cases/${activeProjectId}/all`);
//   //       // Expecting array of groups with children/cases OR adapt to your backend
//   //       setTree(data);
//   //     } catch (err: any) {
//   //       console.error(err);
//   //       setError(err.message);
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   }

//   //   loadTree();
//   // }, [activeProjectId]);

//   useEffect(() => {
//     if (!activeProjectId) {
//       setTree([]);
//       return;
//     }

//     async function loadTree() {
//       try {
//         setLoading(true);
//         const data: TestCaseItem[] = await apiFetch(`http://localhost:4000/api/test_cases/${activeProjectId}/all`);
//         const tree = buildTreeFromCases(data);
//         setTree(tree);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }

//     loadTree();
//   }, [activeProjectId]);

//   /* ----------------------------- Load planCases when plan changes ----------------------------- */
//   const loadPlanCases = useCallback(async () => {
//     try {
//         setLoading(true);
//         // Endpoint: GET /api/plan_cases?planId=...
//         const data: PlanCases[] = await apiFetch(`http://localhost:4000/api/test_plan_cases/${activePlanId}`);
//         // Ensure positions are numeric & sort
//         //const normalized = data.slice().sort((a, b) => a.position - b.position);
//         const normalized: PlanCase[] = data
//           .map(item => ({
//             id: item.plan_case_id,
//             testCaseId: item.test_case_id,    // <-- tu zmiana!
//             title: item.title,
//             description: item.description,
//             expected_result: item.expected_result,
//             position: item.position
//           })).sort((a, b) => a.position - b.position);
          
//         setPlanCases(normalized);
//       } catch (err: any) {
//         console.error(err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//   }, [activePlanId]);

//   useEffect(() => {
//     if (!activePlanId) {
//       setPlanCases([]);
//       return;
//     }
//     loadPlanCases();

//   }, [activePlanId, loadPlanCases]);

//   //   async function loadPlanCases() {
//   //     try {
//   //       setLoading(true);
//   //       // Endpoint: GET /api/plan_cases?planId=...
//   //       const data: PlanCases[] = await apiFetch(`http://localhost:4000/api/test_plan_cases/${activePlanId}`);
//   //       // Ensure positions are numeric & sort
//   //       //const normalized = data.slice().sort((a, b) => a.position - b.position);
//   //       const normalized: PlanCase[] = data
//   //         .map(item => ({
//   //           id: item.plan_case_id,
//   //           testCaseId: item.test_case_id,    // <-- tu zmiana!
//   //           title: item.title,
//   //           description: item.description,
//   //           expected_result: item.expected_result,
//   //           position: item.position
//   //         })).sort((a, b) => a.position - b.position);
          
//   //       setPlanCases(normalized);
//   //     } catch (err: any) {
//   //       console.error(err);
//   //       setError(err.message);
//   //     } finally {
//   //       setLoading(false);
//   //     }
//   //   }

//   //   loadPlanCases();
//   // }, [activePlanId]);

//   /* ----------------------------- CRUD: Releases ----------------------------- */
//   async function createRelease() {
//     if (!activeProjectId || !newReleaseVersion.trim()) return;
//     try {
//       setLoading(true);
//       const body = { 
//         projectId: activeProjectId,
//         version: newReleaseVersion.trim(),
//         description: "",
//         releasedAt: null
//       };

//       const created = await apiFetch(`http://localhost:4000/api/releases/new`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(body),
//       });
//       setReleases((r) => [created, ...r]);
//       setNewReleaseVersion("");
//       setMessage("Release created");
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function deleteRelease(releaseId: number) {
//     if (!confirm("Are you sure you want to delete this release?")) 
//       return;

//     try {
//       setLoading(true);

//       await apiFetch(`http://localhost:4000/api/releases/${releaseId}`,
//         { 
//           method: "DELETE" 
//         });
      
//       setReleases((prev) => prev.filter((r) => r.id !== releaseId));

//       if (activeReleaseId === releaseId) {
//         setActiveReleaseId(null);
//         setPlans([]);
//         setActivePlanId(null);
//       }
//       setMessage("Release deleted");
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   /* ----------------------------- CRUD: Plans ----------------------------- */
//   async function createPlan() {
//     if (!activeReleaseId || !newPlanName.trim()) 
//       return;

//     try {
//       setLoading(true);

//       const created = await apiFetch(`http://localhost:4000/api/test_plans/new/${activeReleaseId}`, 
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name: newPlanName.trim(), description: "" }),
//       });

//       setPlans((p) => [created, ...p]);
//       setNewPlanName("");
//       setMessage("Plan created");

//     } catch (err: any) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function deletePlan(planId: number) {
//     if (!confirm("Delete plan? This cannot be undone if the plan has runs.")) return;
//     try {
//       setLoading(true);
//       // DELETE /api/plans/:planId
//       await apiFetch(`/api/plans/${planId}`, { method: "DELETE" });
//       setPlans((prev) => prev.filter((p) => p.id !== planId));
//       if (activePlanId === planId) {
//         setActivePlanId(null);
//         setPlanCases([]);
//       }
//       setMessage("Plan deleted");
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   // async function clonePlan(planId: number) {
//   //   if (!confirm("Clone plan? A new plan will be created in the same release.")) return;
//   //   try {
//   //     setLoading(true);
//   //     // POST /api/plans/:planId/clone
//   //     const cloned: Plan = await apiFetch(`/api/plans/${planId}/clone`, { method: "POST" });
//   //     // After clone, reload plans for current release to get up-to-date list
//   //     const updatedPlans = await apiFetch(`/api/releases/${cloned.releaseId}/plans`);
//   //     setPlans(updatedPlans);
//   //     setActivePlanId(cloned.id);
//   //     // load plan cases for new plan
//   //     const newCases: PlanCase[] = await apiFetch(`/api/plan_cases?planId=${cloned.id}`);
//   //     setPlanCases(newCases.sort((a, b) => a.position - b.position));
//   //     setMessage("Plan cloned");
//   //   } catch (err: any) {
//   //     console.error(err);
//   //     setError(err.message);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // }
//   async function clonePlan(planId: number) {
//   if (!activeReleaseId) {
//     setError("No active release selected");
//     return;
//   }

//   if (!confirm("Clone this plan into the current release?")) return;

//   try {
//     setLoading(true);

//     // POST /api/test_plans/:planId/clone
//     const cloned = await apiFetch(`http://localhost:4000/api/test_plans/${planId}/clone`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ releaseId: activeReleaseId })
//     });

//     // Dodaj klona do listy planów
//     //setPlans((prev) => [cloned, ...prev]);

//     setPlans((prev) => [cloned, ...prev]);

//     // Ustaw nowy plan jako aktywny
//     setActivePlanId(cloned.id);

//     setMessage("Plan cloned successfully");
//   } catch (err: any) {
//     console.error(err);
//     setError(err.message);
//   } finally {
//     setLoading(false);
//   }
// }

//   /* ----------------------------- Plan cases operations ----------------------------- */
//   async function addCaseToPlan(testCase: TestCase) {
//     if (!activePlanId) return;
//     try {
//       setLoading(true);
//       const created: PlanCase = await apiFetch("http://localhost:4000/api/test_plan_cases", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ testPlanId: activePlanId, testCaseId: testCase.id }),
//       });
//       setPlanCases((prev) => [...prev, created].sort((a, b) => a.position - b.position));
//     } catch (err: any) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function removeCaseFromPlan(testCaseId: number) {
//     if (!confirm("Delete test from plan?")) return;
//     if (!activePlanId) return;
//     try {
//       setLoading(true);
//       // DELETE /api/plan_cases/:id
//       await apiFetch(`http://localhost:4000/api/test_plan_cases`, 
//         { 
//           method: "DELETE",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ testPlanId: activePlanId, testCaseId: testCaseId })
//         });
//       // Reload positions locally (backend should re-index or you can call GET)
//       // setPlanCases((prev) =>
//       //   prev
//       //     .filter((p) => p.id !== planCaseId)
//       //     .map((p, i) => ({ ...p, position: i + 1 }))
//       // );

//       await loadPlanCases();

//     } catch (err: any) {
//       console.error(err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

//   /* ----------------------------- Reorder handling (drag&drop) ----------------------------- */
//   async function onDragEnd(result: DropResult) {
//     if (!result.destination) return;
//     const updated = Array.from(planCases);
//     const [moved] = updated.splice(result.source.index, 1);
//     updated.splice(result.destination.index, 0, moved);
//     const reindexed = updated.map((p, i) => ({ ...p, position: i + 1 }));
//     setPlanCases(reindexed);

//     try {
//       // Send reorder to backend
//       // PUT /api/plan_cases/reorder with body { planCases: [{ id, position }, ...] }
//       await apiFetch("/api/plan_cases/reorder", {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ planCases: reindexed.map((p) => ({ id: p.id, position: p.position })) }),
//       });
//     } catch (err: any) {
//       console.error("Reorder failed:", err);
//       setError("Failed to persist new order. It will be refreshed.");
//       // Optionally re-load from server to correct positions
//       if (activePlanId) {
//         try {
//           const data: PlanCase[] = await apiFetch(`/api/plan_cases?planId=${activePlanId}`);
//           setPlanCases(data.sort((a, b) => a.position - b.position));
//         } catch (e) {
//           console.error(e);
//         }
//       }
//     }
//   }

//   /* ----------------------------- UI Rendering ----------------------------- */
//   return (
//     <div className="flex h-screen bg-gray-100 text-sm">
//       {/* LEFT: Projects */}
//       <aside className="w-56 bg-white p-4 border-r overflow-auto">
//         <h3 className="font-bold mb-3">Projects</h3>
//         {loading && projects.length === 0 ? (
//           <div>Loading projects...</div>
//         ) : (
//           projects.map((p) => (
//             <div
//               key={p.id}
//               onClick={() => {
//                 setActiveProjectId(p.id);
//                 setActiveReleaseId(null);
//                 setActivePlanId(null);
//                 setPlanCases([]);
//               }}
//               className={`cursor-pointer p-2 mb-1 rounded ${activeProjectId === p.id ? "bg-blue-500 text-white" : "hover:bg-gray-50"}`}
//             >
//               {p.name}
//             </div>
//           ))
//         )}
//       </aside>

//       {/* LEFT-MIDDLE: Releases */}
//       <aside className="w-56 bg-gray-50 p-4 border-r overflow-auto">
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="font-bold">Releases</h3>
//         </div>

//         <div className="mb-2">
//           <input
//             className="w-full border p-1 rounded mb-1"
//             placeholder="New version (e.g. 2.3.0)"
//             value={newReleaseVersion}
//             onChange={(e) => setNewReleaseVersion(e.target.value)}
//           />
//           <button 
//             onClick={createRelease} 
//             className="w-full bg-green-600 text-white py-1 rounded cursor-pointer"
//           >Add Release</button>
//         </div>

//         {loading && releases.length === 0 ? (
//           <div>Loading releases...</div>
//         ) : (
//           releases.map((r) => (
//           <>
//             <div onClick={ () => { 
//                 setActiveReleaseId(r.id); 
//                 setActivePlanId(null); 
//                 setPlanCases([]); }
//               } 
//                 key={r.id} className={`flex justify-between items-center p-2 mb-1 rounded ${activeReleaseId === r.id ? "bg-green-500 text-white" : "hover:bg-gray-100"}`}>
//               <div>{r.version}</div>
//             </div>
//             <div className="flex gap-2"><button className="px-2 py-0.5 bg-red-500 text-white rounded" onClick={() => deleteRelease(r.id)}>Del</button></div>
//           </>
//           ))
//         )}
//       </aside>

//       {/* MIDDLE: Plans */}
//       <aside className="w-56 bg-gray-50 p-4 border-r overflow-auto">
//         <h3 className="font-bold mb-3">Plans</h3>

//         <div className="mb-2">
//           <input
//             className="w-full border p-1 rounded mb-1"
//             placeholder="New plan name"
//             value={newPlanName}
//             onChange={(e) => setNewPlanName(e.target.value)}
//           />
//           <button onClick={createPlan} className="w-full bg-indigo-600 text-white py-1 rounded">Add Plan</button>
//         </div>

//         {/* {plans.map((p) => (
//           <div key={p.id} className={`flex justify-between items-center p-2 mb-1 rounded ${activePlanId === p.id ? "bg-purple-500 text-white" : "hover:bg-gray-100"}`}>
//             <span onClick={() => { setActivePlanId(p.id); }}>{p.name}</span>
//             <div className="flex gap-2">
//               <button className="px-2 py-0.5 bg-yellow-500 text-white rounded" onClick={() => clonePlan(p.id)}>Clone</button>
//               <button className="px-2 py-0.5 bg-red-500 text-white rounded" onClick={() => deletePlan(p.id)}>Del</button>
//             </div>
//           </div>
//         ))} */}
//         {plans.map((releaseGroup: any) => (
//   <div key={releaseGroup.releaseId} className="mb-4">
//     {/* Nagłówek release */}
//     <div className="font-bold mb-2">{releaseGroup.releaseVersion}</div>

//     {/* Plany w release */}
//     {releaseGroup.plans.map((p: any) => (
//       <div
//         key={p.id}
//         className={`flex justify-between items-center p-2 mb-1 rounded ${
//           activePlanId === p.id ? "bg-purple-500 text-white" : "hover:bg-gray-100"
//         }`}
//       >
//         <span onClick={() => setActivePlanId(p.id)}>{p.name}</span>
//         <div className="flex gap-2">
//           <button
//             className="px-2 py-0.5 bg-yellow-500 text-white rounded"
//             onClick={() => clonePlan(p.id)}
//           >
//             Clone
//           </button>
//           <button
//             className="px-2 py-0.5 bg-red-500 text-white rounded"
//             onClick={() => deletePlan(p.id)}
//           >
//             Del
//           </button>
//         </div>
//       </div>
//     ))}
//   </div>
// ))}
//       </aside>

//       {/* MIDDLE-RIGHT: Test Cases Library */}
//       <main className="flex-1 p-4 overflow-auto bg-white">
//         <h3 className="font-bold mb-3">Test Cases Library</h3>

//         {!activePlanId && <div className="text-gray-400">Select a plan to add tests</div>}

//         {activePlanId && tree.length === 0 && (
//           <div className="text-gray-400">No test cases in library for this project</div>
//         )}

//         {activePlanId && Array.isArray(tree) && tree.map((group) => (
//           <TreeNode key={group.id} node={group} addCaseToPlan={addCaseToPlan} />
//         ))}
//       </main>
//       {/* <main className="flex-1 p-4 overflow-auto bg-white">
//         <h3 className="font-bold mb-3">Test Cases Library</h3>

//         {!activePlanId && <div className="text-gray-400">Select a plan to add tests</div>}

//         {activePlanId && tree.length === 0 && (
//           <div className="text-gray-400">No test cases in library for this project</div>
//         )}

//         {/* {activePlanId && Array.isArray(tree) && tree.map((group) => (
//           <div key={group.id} className="mb-4">
//             <div className="font-semibold">{group.name}</div>
//             <ul className="pl-4 mt-2 space-y-1">
//               {group.cases?.map((tc) => (
//                 <li key={tc.id} className="flex justify-between items-center">
//                   <span>{tc.title}</span>
//                   <button
//                     className="text-white bg-green-600 px-2 py-0.5 rounded"
//                     onClick={() => addCaseToPlan(tc)}
//                   >
//                     Add
//                   </button>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         ))} */}

//         {/* {activePlanId && Array.isArray(tree) && tree.map((group) => (
//           <TreeNode key={group.id} node={group} addCaseToPlan={addCaseToPlan} />
//         ))}
//       </main> */}

//       {/* RIGHT: Plan Content */}
//       <aside className="w-96 p-4 bg-gray-50 border-l overflow-auto">
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="font-bold">Plan Content</h3>
//           <div className="text-xs text-gray-500">Plan ID: {activePlanId ?? "-"}</div>
//         </div>

//         {planCases.length === 0 && <div className="text-gray-400">No tests in plan</div>}

//         <DragDropContext onDragEnd={onDragEnd}>
//           <Droppable droppableId="planCases">
//             {(provided) => (
//               <ul {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
//                 {planCases.map((tc, index) => (
//                   <Draggable key={tc.id} draggableId={tc.id.toString()} index={index}>
//                     {(prov) => (
//                       <li
//                         ref={prov.innerRef}
//                         {...prov.draggableProps}
//                         {...prov.dragHandleProps}
//                         className="flex justify-between items-center p-2 border rounded bg-white"
//                       >
//                         <div>
//                           <div className="text-sm font-medium">{index + 1}. {tc.title}</div>
//                           <div className="text-xs text-gray-500">pos: {tc.position} • id: {tc.id}</div>
//                         </div>
//                         <div className="flex gap-2">
//                           <button className="px-2 py-0.5 bg-red-500 text-white rounded" onClick={() => removeCaseFromPlan(tc.id)}>Remove</button>
//                         </div>
//                       </li>
//                     )}
//                   </Draggable>
//                 ))}
//                 {provided.placeholder}
//               </ul>
//             )}
//           </Droppable>
//         </DragDropContext>
//       </aside>

//       {/* bottom notifications */}
//       <div className="fixed bottom-4 left-4">
//         {message && <div className="bg-green-600 text-white px-4 py-2 rounded shadow">{message}</div>}
//         {error && <div className="bg-red-600 text-white px-4 py-2 rounded shadow mt-2">{error}</div>}
//       </div>
//     </div>
//   );
// }