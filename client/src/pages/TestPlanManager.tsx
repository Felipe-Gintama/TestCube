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
  group_name?: string;
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
  name?: string;
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
        name: `Group ${tc.group_name}`,
        parent_id: null,
        cases: [],
        children: [],
      };
    }

    groupsMap[tc.group_id].cases.push(tc);
  });

  return Object.values(groupsMap);
}

function TreeNode({
  node,
  addCaseToPlan,
}: {
  node: TestGroupNode;
  addCaseToPlan: (tc: TestCase) => void;
}) {
  return (
    <div className="mb-2 pl-4 border-l">
      <div className="font-semibold">{node.name}</div>{" "}
      <>{console.log(node.name)}</>
      {node.cases.length > 0 && (
        <ul className="pl-4 mt-1 space-y-1">
          {node.cases.map((tc) => (
            <li
              key={tc.id}
              className="flex justify-between items-center hover:bg-gray-100"
            >
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

export default function TestPlanManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [activeReleaseId, setActiveReleaseId] = useState<number | null>(null);
  const [plans, setPlans] = useState<ReleaseGroup[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [tree, setTree] = useState<TestGroupNode[]>([]);
  const [planCases, setPlanCases] = useState<PlanCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newReleaseVersion, setNewReleaseVersion] = useState("");
  const [newPlanName, setNewPlanName] = useState("");
  const [editingReleaseId, setEditingReleaseId] = useState<number | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [newPlanNameEdit, setNewPlanNameEdit] = useState("");

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

  useEffect(() => {
    loadProjects();
  }, []);

  /* ----------------------------- Load releases when project changes ----------------------------- */
  async function loadReleases() {
    try {
      setLoading(true);
      const data = await apiFetch(
        `http://localhost:4000/api/releases/${activeProjectId}`
      );
      setReleases(data);
      setActiveReleaseId((prev) =>
        data.find((r: Release) => r.id === prev) ? prev : data[0]?.id ?? null
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeProjectId) {
      setReleases([]);
      setActiveReleaseId(null);
      return;
    }

    loadReleases();
    // reset downstream
    setPlans([]);
    setActivePlanId(null);
    setPlanCases([]);
  }, [activeProjectId]);

  /* ----------------------------- Load plans grouped by releases when project changes ----------------------------- */
  async function loadPlansGrouped() {
    try {
      setLoading(true);
      const data = await apiFetch(
        `http://localhost:4000/api/test_plans/${activeProjectId}`
      );
      if (Array.isArray(data) && data.length > 0) {
        if (data[0].releaseId !== undefined && Array.isArray(data[0].plans)) {
          setPlans(data);
        } else {
          const grouped = (data as any[]).reduce(
            (acc: Record<number, ReleaseGroup>, row: any) => {
              const rid = row.release_id;
              if (!acc[rid]) {
                acc[rid] = {
                  releaseId: rid,
                  releaseVersion: row.release_version ?? `Release ${rid}`,
                  plans: [],
                };
              }
              acc[rid].plans.push({
                id: row.id,
                name: row.name,
                description: row.description,
                project_id: row.project_id,
                created_by: row.created_by,
                created_at: row.created_at,
              });
              return acc;
            },
            {}
          );
          setPlans(Object.values(grouped));
        }
      } else {
        setPlans([]);
      }

      if (activeReleaseId) {
        const rg = (data as any[]).find(
          (g: any) =>
            g.releaseId === activeReleaseId || g.release_id === activeReleaseId
        );
        const firstPlan = rg?.plans?.[0] ?? null;
        setActivePlanId(firstPlan?.id ?? null);
      } else {
        const firstGroup = data && data[0] ? data[0] : null;
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

  useEffect(() => {
    if (!activeProjectId) {
      setPlans([]);
      return;
    }

    loadPlansGrouped();
    setPlanCases([]);
  }, [activeProjectId]);

  async function loadTree() {
    try {
      setLoading(true);
      const data: TestCaseItem[] = await apiFetch(
        `http://localhost:4000/api/test_cases/${activeProjectId}/all`
      );
      console.log(data);
      setTree(buildTreeFromCases(data));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeProjectId) {
      setTree([]);
      return;
    }

    loadTree();
  }, [activeProjectId]);

  const loadPlanCases = useCallback(async () => {
    if (!activePlanId) {
      setPlanCases([]);
      return;
    }
    try {
      setLoading(true);
      const data: PlanCases[] = await apiFetch(
        `http://localhost:4000/api/test_plan_cases/${activePlanId}`
      );
      const normalized: PlanCase[] = data.map((item) => ({
        id: item.plan_case_id,
        testCaseId: item.test_case_id,
        title: item.title,
        name: item.group_name,
        position: item.position,
      }));
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
      await apiFetch(`http://localhost:4000/api/releases/${releaseId}`, {
        method: "DELETE",
      });
      setReleases((prev) => prev.filter((r) => r.id !== releaseId));
      if (activeReleaseId === releaseId) {
        setActiveReleaseId(null);
        setPlans([]);
        setActivePlanId(null);
      }

      await reloadAll();

      setMessage("Release deleted");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function renameRelease(releaseId: number) {
    try {
      setLoading(true);
      await apiFetch(`http://localhost:4000/api/releases/rename/${releaseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: newName }),
      });

      await loadReleases();
      await loadPlansGrouped();
    } catch (error: any) {
      console.error(error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function createPlan() {
    if (!activeReleaseId || !newPlanName.trim()) return;

    try {
      setLoading(true);

      await apiFetch(
        `http://localhost:4000/api/test_plans/new/${activeReleaseId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newPlanName.trim(), description: "" }),
        }
      );

      await reloadAll();
      // setPlans((prev) => {
      //   const idx = prev.findIndex((rg) => rg.releaseId === activeReleaseId);
      //   if (idx !== -1) {
      //     const newGroups = [...prev];
      //     newGroups[idx] = { ...newGroups[idx], plans: [created, ...newGroups[idx].plans] };
      //     return newGroups;
      //   } else {

      //     const rel = releases.find((r) => r.id === activeReleaseId);
      //     const newGroup: ReleaseGroup = {
      //       releaseId: activeReleaseId,
      //       releaseVersion: rel?.version ?? `Release ${activeReleaseId}`,
      //       plans: [created],
      //     };
      //     return [newGroup, ...prev];
      //   }
      // });
      // setNewPlanName("");
      // setActivePlanId(created.id);

      setMessage("Plan created");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function renamePlan(planId: number) {
    try {
      setLoading(true);
      await apiFetch(`http://localhost:4000/api/test_plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlanNameEdit }),
      });

      await loadPlansGrouped();
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deletePlan(planId: number) {
    if (!confirm("Delete plan? This cannot be undone if the plan has runs."))
      return;
    try {
      setLoading(true);
      await apiFetch(`http://localhost:4000/api/test_plans/${planId}`, {
        method: "DELETE",
      });
      await reloadAll();

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

      const cloned: any = await apiFetch(
        `http://localhost:4000/api/test_plans/${planId}/clone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ releaseId: activeReleaseId }),
        }
      );

      setPlans((prev) => {
        const idx = prev.findIndex((rg) => rg.releaseId === activeReleaseId);
        if (idx !== -1) {
          const newGroups = [...prev];
          newGroups[idx] = {
            ...newGroups[idx],
            plans: [cloned, ...newGroups[idx].plans],
          };
          return newGroups;
        } else {
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
      await apiFetch("http://localhost:4000/api/test_plan_cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testPlanId: activePlanId,
          testCaseId: testCase.id,
        }),
      });
      //setPlanCases((prev) => [...prev, created].sort((a, b) => a.position - b.position));

      await loadPlanCases();
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
  // async function onDragEnd(result: DropResult) {
  //   if (!result.destination) return;
  //   const updated = Array.from(planCases);
  //   const [moved] = updated.splice(result.source.index, 1);
  //   updated.splice(result.destination.index, 0, moved);
  //   const reindexed = updated.map((p, i) => ({ ...p, position: i + 1 }));
  //   setPlanCases(reindexed);

  //   try {
  //     await apiFetch("/api/plan_cases/reorder", {
  //       method: "PUT",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ planCases: reindexed.map((p) => ({ id: p.id, position: p.position })) }),
  //     });
  //   } catch (err: any) {
  //     console.error("Reorder failed:", err);
  //     setError("Failed to persist new order. It will be refreshed.");
  //     if (activePlanId) {
  //       try {
  //         const data: PlanCase[] = await apiFetch(`/api/plan_cases?planId=${activePlanId}`);
  //         setPlanCases(data.sort((a, b) => a.position - b.position));
  //       } catch (e) {
  //         console.error(e);
  //       }
  //     }
  //   }
  // }

  //RELOAD ALL
  async function reloadAll() {
    try {
      await loadProjects();
      await loadReleases();
      await loadPlansGrouped();
      await loadPlanCases();
      await loadTree();

      console.log("all components has been reloaded");
    } catch (err) {
      console.error(err);
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
              className={`cursor-pointer p-2 mb-1 rounded ${
                activeProjectId === p.id
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-50"
              }`}
            >
              {p.name}
            </div>
          ))
        )}
      </aside>

      {/* LEFT-MIDDLE: Releases */}
      <aside className="w-90 bg-gray-50 p-4 border-r overflow-auto">
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
                  if (editingReleaseId) return;
                  setActiveReleaseId(r.id);
                  const group = plans.find((g) => g.releaseId === r.id);
                  setActivePlanId(group?.plans?.[0]?.id ?? null);
                  setPlanCases([]);
                }}
                className={`flex justify-between items-center p-2 rounded ${
                  activeReleaseId === r.id
                    ? "bg-gray-300 text-black"
                    : "hover:bg-gray-200"
                }`}
              >
                <div className="flex gap-2 items-center">
                  {editingReleaseId === r.id ? (
                    <>
                      <input
                        className="border px-2 py-1 rounded text-black bg-white"
                        value={newName}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <button
                        className="px-2 py-1 bg-green-600 text-white rounded cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          renameRelease(r.id);
                          setEditingReleaseId(null);
                        }}
                      >
                        OK
                      </button>
                      <button
                        className="px-2 py-1 bg-red-600 text-white rounded cursor-pointer"
                        onClick={() => {
                          setEditingReleaseId(null);
                        }}
                      >
                        CANCEL
                      </button>
                    </>
                  ) : (
                    <span>{r.version}</span>
                  )}
                </div>

                {/* ZMIANA */}
                {editingReleaseId !== r.id && (
                  <div>
                    <button
                      className="mx-1 px-2 bg-red-500 text-white rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRelease(r.id);
                      }}
                    >
                      Del
                    </button>

                    <button
                      className="mx-1 px-2 bg-blue-500 text-white rounded cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReleaseId(r.id);
                        setNewName(r.version);
                      }}
                    >
                      Rename
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </aside>

      {/* MIDDLE: Plans (grouped by release) */}
      <aside className="w-70 bg-gray-50 p-4 border-r overflow-auto">
        <h3 className="font-bold mb-3">Plans</h3>

        <div className="mb-2">
          <input
            className="w-full border p-1 rounded mb-1"
            placeholder="New plan name"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
          />
          <button
            onClick={createPlan}
            className="w-full bg-indigo-600 text-white py-1 rounded"
          >
            Add Plan
          </button>
        </div>

        {/* Render grouped plans safely */}
        {plans.length === 0 && (
          <div className="text-gray-500">No plans for this project</div>
        )}

        {plans.map((releaseGroup) => (
          <div key={releaseGroup.releaseId} className="mb-4">
            <div className="font-bold mb-2">{releaseGroup.releaseVersion}</div>

            {Array.isArray(releaseGroup.plans) &&
            releaseGroup.plans.length > 0 ? (
              releaseGroup.plans.map((p) => (
                <div
                  onClick={() => {
                    if (editingPlanId) return;
                    setActivePlanId(p.id);
                  }}
                  className={`flex justify-between items-center p-2 mb-1 rounded ${
                    activePlanId === p.id
                      ? "bg-purple-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <div className="flex gap-2 items-center">
                    {editingPlanId === p.id ? (
                      <>
                        <input
                          className="border px-2 py-1 rounded text-black bg-white"
                          value={newPlanNameEdit}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setNewPlanNameEdit(e.target.value)}
                        />

                        <button
                          className="px-2 py-1 bg-green-600 text-white rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            renamePlan(p.id);
                            setEditingPlanId(null);
                          }}
                        >
                          OK
                        </button>

                        <button
                          className="px-2 py-1 bg-red-600 text-white rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPlanId(null);
                          }}
                        >
                          CANCEL
                        </button>
                      </>
                    ) : (
                      <span>{p.name}</span>
                    )}
                  </div>

                  {editingPlanId !== p.id && (
                    <div className="flex gap-1">
                      <button
                        className="px-2 bg-yellow-500 text-white rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          clonePlan(p.id);
                        }}
                      >
                        Clone
                      </button>

                      <button
                        className="px-2 bg-red-500 text-white rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlan(p.id);
                        }}
                      >
                        Del
                      </button>

                      <button
                        className="px-2 bg-blue-500 text-white rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlanId(p.id);
                          setNewPlanNameEdit(p.name);
                        }}
                      >
                        Rename
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400">
                No plans in this release
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* MIDDLE-RIGHT: Test Cases Library */}
      <main className="flex-1 p-4 overflow-auto bg-white">
        <h3 className="font-bold mb-3">Test Cases Library</h3>

        {!activePlanId && (
          <div className="text-gray-400">Select a plan to add tests</div>
        )}

        {activePlanId && tree.length === 0 && (
          <div className="text-gray-400">
            No test cases in library for this project
          </div>
        )}

        {activePlanId &&
          Array.isArray(tree) &&
          tree.map((group) => (
            <TreeNode
              key={group.id}
              node={group}
              addCaseToPlan={addCaseToPlan}
            />
          ))}
      </main>

      {/* RIGHT: Plan Content */}
      <aside className="w-96 p-4 bg-gray-50 border-l overflow-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Plan Content</h3>
          <div className="text-xs text-gray-500">
            Plan ID: {activePlanId ?? "-"}
          </div>
        </div>

        {planCases.length === 0 && (
          <div className="text-gray-400">No tests in plan</div>
        )}

        <ul className="space-y-2">
          {planCases.map((tc) => (
            <li
              key={tc.id}
              className="flex justify-between items-center p-2 border rounded bg-white"
            >
              <div>
                <div className="text-sm font-medium">{tc.title}</div>
                <div className="text-xs text-gray-500">
                  group name: {tc.name}
                  {/* id: {tc.id} */}
                </div>
              </div>
              <button
                className="px-2 py-0.5 bg-red-500 text-white rounded"
                onClick={() => removeCaseFromPlan(tc.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {/* bottom notifications */}
      <div className="fixed bottom-4 left-4">
        {message && (
          <div className="bg-green-600 text-white px-4 py-2 rounded shadow">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-600 text-white px-4 py-2 rounded shadow mt-2">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

//DRAG AND DROP IMPLEMENTATION
{
  /* <aside className="w-96 p-4 bg-gray-50 border-l overflow-auto">
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
      </aside> */
}

//---------------------------------------------------------------
{
  /* <aside className="w-70 bg-gray-50 p-4 border-r overflow-auto">
        <h3 className="font-bold mb-3">Plans</h3>

        <div className="mb-2">
          <input
            className="w-full border p-1 rounded mb-1"
            placeholder="New plan name"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
          />
          <button
            onClick={createPlan}
            className="w-full bg-indigo-600 text-white py-1 rounded"
          >
            Add Plan
          </button>
        </div>


        {plans.length === 0 && (
          <div className="text-gray-500">No plans for this project</div>
        )}

        {plans.map((releaseGroup) => (
          <div key={releaseGroup.releaseId} className="mb-4">
            <div className="font-bold mb-2">{releaseGroup.releaseVersion}</div>

            {Array.isArray(releaseGroup.plans) &&
            releaseGroup.plans.length > 0 ? (
              releaseGroup.plans.map((p) => (
                <div
                  key={p.id}
                  className={`flex justify-between items-center p-2 mb-1 rounded ${
                    activePlanId === p.id
                      ? "bg-purple-500 text-white"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <span
                    onClick={() => {
                      setActivePlanId(p.id);
                    }}
                  >
                    {p.name}
                  </span>
                  <div className="flex gap-2">
                    <button
                      className="px-2 py-0.5 bg-yellow-500 text-white rounded"
                      onClick={() => clonePlan(p.id)}
                    >
                      Clone
                    </button>
                    <button
                      className="px-2 py-0.5 bg-red-500 text-white rounded"
                      onClick={() => deletePlan(p.id)}
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-400">
                No plans in this release
              </div>
            )}
          </div>
        ))}
      </aside> */
}
