import { useCallback, useEffect, useState, useRef } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import {
  Home,
  Settings,
  User,
  Edit,
  Minus,
  Plus,
  UserMinus,
  UserRoundMinus,
  BookCopy,
  PenLine,
  Delete,
} from "lucide-react";

import type { TestCaseItem, TestGroupNode } from "../types/testTree";
import React from "react";
import { ResizableAside } from "../styles/ResizeableAsideProps";

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
  const [plansLibrary, setPlansLibrary] = useState<Plan[]>([]);
  const [releasePlans, setReleasePlans] = useState<ReleaseGroup[]>([]);
  const [selectedCases, setSelectedCases] = useState<number[]>([]);
  const [selectedPlanCases, setSelectedPlanCases] = useState<number[]>([]);

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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

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
        `http://localhost:4000/api/releases/${activeProjectId}`,
      );
      setReleases(data);
      setActiveReleaseId((prev) =>
        data.find((r: Release) => r.id === prev) ? prev : (data[0]?.id ?? null),
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
    //setPlans([]);
    setActivePlanId(null);
    setPlanCases([]);
  }, [activeProjectId]);

  async function loadPlansLibrary() {
    if (!activeProjectId) return;

    try {
      const data = await apiFetch(
        `http://localhost:4000/api/test_plans/${activeProjectId}`,
      );
      console.log("plans library =>", data);
      setPlansLibrary(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!activeProjectId) {
      setPlansLibrary([]);
      return;
    }

    loadPlansLibrary();
  }, [activeProjectId]);

  async function loadReleasePlans() {
    if (!activeProjectId) return;

    try {
      const data = await apiFetch(
        `http://localhost:4000/api/test_plans/${activeProjectId}/releases`,
      );
      console.log("plans for releases " + data);
      setReleasePlans(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!activeProjectId) {
      setReleasePlans([]);
      return;
    }

    loadReleasePlans();
  }, [activeProjectId]);

  /* ----------------------------- Load plans grouped by releases when project changes ----------------------------- */
  async function loadPlansGrouped() {
    try {
      setLoading(true);
      const data = await apiFetch(
        `http://localhost:4000/api/test_plans/${activeProjectId}`,
      );
      if (Array.isArray(data) && data.length > 0) {
        if (data[0].releaseId !== undefined && Array.isArray(data[0].plans)) {
          //setPlans(data);
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
            {},
          );
          //setPlans(Object.values(grouped));
        }
      } else {
        //setPlans([]);
      }

      if (activeReleaseId) {
        const rg = (data as any[]).find(
          (g: any) =>
            g.releaseId === activeReleaseId || g.release_id === activeReleaseId,
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

  // useEffect(() => {
  //   if (!activeProjectId) {
  //     //setPlans([]);
  //     return;
  //   }

  //   loadPlansGrouped();
  //   setPlanCases([]);
  // }, [activeProjectId]);

  async function loadTree() {
    try {
      setLoading(true);
      const data: TestCaseItem[] = await apiFetch(
        `http://localhost:4000/api/test_cases/${activeProjectId}/all`,
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
        `http://localhost:4000/api/test_plan_cases/${activePlanId}`,
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
        //setPlans([]);
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

  // async function createPlan() {
  //   if (!activeReleaseId || !newPlanName.trim()) return;

  //   try {
  //     setLoading(true);

  //     await apiFetch(
  //       `http://localhost:4000/api/test_plans/new/${activeReleaseId}`,
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ name: newPlanName.trim(), description: "" }),
  //       },
  //     );

  //     await reloadAll();
  //     // setPlans((prev) => {
  //     //   const idx = prev.findIndex((rg) => rg.releaseId === activeReleaseId);
  //     //   if (idx !== -1) {
  //     //     const newGroups = [...prev];
  //     //     newGroups[idx] = { ...newGroups[idx], plans: [created, ...newGroups[idx].plans] };
  //     //     return newGroups;
  //     //   } else {

  //     //     const rel = releases.find((r) => r.id === activeReleaseId);
  //     //     const newGroup: ReleaseGroup = {
  //     //       releaseId: activeReleaseId,
  //     //       releaseVersion: rel?.version ?? `Release ${activeReleaseId}`,
  //     //       plans: [created],
  //     //     };
  //     //     return [newGroup, ...prev];
  //     //   }
  //     // });
  //     // setNewPlanName("");
  //     // setActivePlanId(created.id);

  //     setMessage("Plan created");
  //   } catch (err: any) {
  //     console.error(err);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }
  async function createPlan() {
    if (!activeProjectId || !newPlanName.trim()) return;

    const created = await apiFetch(
      `http://localhost:4000/api/test_plans/new/${activeReleaseId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPlanName.trim(),
          projectId: activeProjectId,
        }),
      },
    );

    setPlansLibrary((prev) => [created, ...prev]);
    setNewPlanName("");
  }

  async function renamePlan(planId: number) {
    try {
      setLoading(true);
      await apiFetch(`http://localhost:4000/api/test_plans/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlanNameEdit }),
      });

      await loadPlansLibrary();
      await loadReleasePlans();
      setEditingPlanId(null);
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
      await loadPlansLibrary();
      await loadReleasePlans();

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

  async function removePlanFromRelease(planId: number, releaseId: number) {
    console.log("Removing plan", planId, "from release", releaseId);

    try {
      await apiFetch(
        `http://localhost:4000/api/test_plans/${planId}/${releaseId}`,
        {
          method: "DELETE",
        },
      );

      console.log("remove: ", planId, releaseId);

      setReleasePlans((prev) =>
        prev.map((group) => {
          if (group.releaseId !== releaseId) return group;

          return {
            ...group,
            plans: group.plans.filter((p) => p.id !== planId),
          };
        }),
      );
    } catch (err) {
      console.error("Failed to remove plan from release", err);
    }
  }

  async function clonePlan(planId: number) {
    try {
      setLoading(true);

      const cloned: any = await apiFetch(
        `http://localhost:4000/api/test_plans/${planId}/clone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      await loadPlansLibrary();

      if (activeReleaseId) {
        await apiFetch(`http://localhost:4000/api/release_plans`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: cloned.id,
            releaseId: activeReleaseId,
          }),
        });

        await loadReleasePlans();
      }

      setActivePlanId(cloned.id);
      setMessage("Plan cloned successfully");
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // async function clonePlan(planId: number) {
  //   if (!activeReleaseId) {
  //     setError("No active release selected");
  //     return;
  //   }
  //   if (!confirm("Clone this plan into the current release?")) return;

  //   try {
  //     setLoading(true);

  //     const cloned: any = await apiFetch(
  //       `http://localhost:4000/api/test_plans/${planId}/clone`,
  //       {
  //         method: "POST",
  //         headers: { "Content-Type": "application/json" },
  //         body: JSON.stringify({ releaseId: activeReleaseId }),
  //       },
  //     );

  //     setPlans((prev) => {
  //       const idx = prev.findIndex((rg) => rg.releaseId === activeReleaseId);
  //       if (idx !== -1) {
  //         const newGroups = [...prev];
  //         newGroups[idx] = {
  //           ...newGroups[idx],
  //           plans: [cloned, ...newGroups[idx].plans],
  //         };
  //         return newGroups;
  //       } else {
  //         const rel = releases.find((r) => r.id === activeReleaseId);
  //         const newGroup: ReleaseGroup = {
  //           releaseId: activeReleaseId,
  //           releaseVersion: rel?.version ?? `Release ${activeReleaseId}`,
  //           plans: [cloned],
  //         };
  //         return [newGroup, ...prev];
  //       }
  //     });

  //     setActivePlanId(cloned.id);
  //     setMessage("Plan cloned successfully");
  //   } catch (err: any) {
  //     console.error(err);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

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
    //if (!confirm("Delete test from plan?")) return;
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

  async function addPlanToRelease(planId: number, releaseId: number) {
    await apiFetch(`http://localhost:4000/api/test_plans/addPlan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, releaseId }),
    });

    await loadReleasePlans();
  }

  const toggleCase = (id: number) => {
    setSelectedCases((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const toggleGroup = (groupId: number) => {
    const group = tree.find((g) => g.id === groupId);
    if (!group) return;

    const groupCaseIds = group.cases.map((c) => c.id);
    const allSelected = groupCaseIds.every((id) => selectedCases.includes(id));

    setSelectedCases((prev) =>
      allSelected
        ? prev.filter((id) => !groupCaseIds.includes(id))
        : [...new Set([...prev, ...groupCaseIds])],
    );
  };

  const togglePlanCase = (id: number) => {
    setSelectedPlanCases((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const togglePlanGroup = (groupName: string, cases: any[]) => {
    const groupIds = cases.map((c) => c.id);
    const allSelected = groupIds.every((id) => selectedPlanCases.includes(id));

    setSelectedPlanCases((prev) =>
      allSelected
        ? prev.filter((id) => !groupIds.includes(id))
        : [...new Set([...prev, ...groupIds])],
    );
  };
  /* ----------------------------- UI Rendering ----------------------------- */
  return (
    <div className="flex h-screen bg-gray-100 text-sm">
      {/* LEFT: Projects */}
      <aside className="min-w-56 w-80 bg-gray-50 p-4 border-r resize overflow-x-auto">
        <h3 className="font-bold mb-3">Projects</h3>

        {loading && projects.length === 0 ? (
          <div className="text-gray-500 text-sm">Loading projects...</div>
        ) : (
          <ul className="flex flex-col w-full">
            {projects.map((p, i) => {
              const isActive = activeProjectId === p.id;

              return (
                <li
                  key={p.id}
                  onClick={() => {
                    setActiveProjectId(p.id);
                    setActiveReleaseId(null);
                    setActivePlanId(null);
                    setPlanCases([]);
                  }}
                  className={`
              inline-flex items-center px-4 py-3 text-sm font-medium
              border border-gray-200 -mt-px
              cursor-pointer
              ${isActive ? "bg-emerald-400 text-white" : "bg-white hover:bg-gray-100"}
              ${i === 0 ? "rounded-t-md mt-0" : ""}
              ${i === projects.length - 1 ? "rounded-b-md" : ""}
            `}
                >
                  {p.name}
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* LEFT-MIDDLE: Releases */}
      <aside className="w-110 bg-gray-50 p-4 border-r overflow-x-auto">
        <h3 className="font-bold mb-4">Releases</h3>

        {/* ===== ADD NEW RELEASE ===== */}
        <div className="mb-4">
          <input
            className="w-full border border-gray-300 px-3 py-2 rounded mb-2 text-sm"
            placeholder="New version (e.g. 2.3.0)"
            value={newReleaseVersion}
            onChange={(e) => setNewReleaseVersion(e.target.value)}
          />
          <button
            onClick={createRelease}
            className="w-full bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 transition"
          >
            Add Release
          </button>
        </div>

        {/* ===== RELEASES LIST ===== */}
        {loading && releases.length === 0 ? (
          <div className="text-gray-500 text-sm">Loading releases...</div>
        ) : (
          <ul className="flex flex-col w-full">
            {releases.map((r, i) => (
              <li
                key={r.id}
                className={`
            inline-flex items-center justify-between
            px-4 py-3 text-sm font-medium
            border border-gray-200 -mt-px
            bg-white
            hover:bg-gray-100 cursor-pointer
            ${i === 0 ? "rounded-t-md mt-0" : ""}
            ${i === releases.length - 1 ? "rounded-b-md" : ""}
            ${activeReleaseId === r.id ? "bg-gray-300 text-black" : ""}
          `}
                onClick={() => {
                  if (!editingReleaseId) setActiveReleaseId(r.id);
                }}
              >
                {/* ===== RELEASE NAME / EDIT ===== */}
                <div className="flex gap-2 items-center">
                  {editingReleaseId === r.id ? (
                    <>
                      <input
                        className="border px-2 py-1 rounded text-sm bg-white"
                        value={newName}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <button
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          renameRelease(r.id);
                          setEditingReleaseId(null);
                        }}
                      >
                        OK
                      </button>
                      <button
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        onClick={() => setEditingReleaseId(null)}
                      >
                        CANCEL
                      </button>
                    </>
                  ) : (
                    <span>{r.version}</span>
                  )}
                </div>

                {/* ===== ACTION BUTTONS ===== */}
                {editingReleaseId !== r.id && (
                  <div className="flex gap-1">
                    <button
                      className="px-2 py-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRelease(r.id);
                      }}
                    >
                      <Delete className="cursor-pointer text-rose-500 hover:text-rose-700"></Delete>
                    </button>
                    <button
                      className="px-2 py-1 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReleaseId(r.id);
                        setNewName(r.version);
                      }}
                    >
                      <PenLine className="cursor-pointer text-teal-500 hover:text-teal-700"></PenLine>
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ADD PLANS TO RELEASE */}
      <aside className="w-110 bg-gray-50 p-4 border-r overflow-auto">
        <h3 className="font-bold mb-4">Add Plans to Release</h3>

        {releases.length === 0 && (
          <div className="text-gray-500 text-sm">No releases available</div>
        )}

        {releases.map((release) => {
          const group = releasePlans.find((g) => g.releaseId === release.id);

          return (
            <div
              key={release.id}
              className="mb-4 border border-gray-200 rounded-md p-2 bg-white"
            >
              {/* ===== RELEASE HEADER ===== */}
              <div className="text-sm font-semibold mb-2 text-gray-700">
                {release.version}
              </div>

              {/* ===== ADD PLAN SELECT ===== */}
              <select
                className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-2 bg-white"
                onChange={(e) => {
                  const planId = Number(e.target.value);
                  if (!planId) return;
                  addPlanToRelease(planId, release.id);
                }}
              >
                <option value="">-- Add plan --</option>

                {plansLibrary
                  .filter((p) => !group?.plans.some((rp) => rp.id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>

              {/* ===== LIST GROUP ===== */}
              <ul className="w-full flex flex-col">
                {group?.plans.map((p, i) => (
                  <li
                    key={p.id}
                    className={`
                inline-flex items-center justify-between
                py-3 px-4 text-sm font-medium
                border border-gray-200 -mt-px
                bg-white
                ${i === 0 ? "rounded-t-md mt-0" : ""}
                ${i === group.plans.length - 1 ? "rounded-b-md" : ""}
              `}
                  >
                    <span className="truncate">{p.name}</span>

                    <button
                      className="px-2 py-1 text-xs transition"
                      onClick={() => removePlanFromRelease(p.id, release.id)}
                    >
                      <Delete className="cursor-pointer text-rose-500 hover:text-rose-700"></Delete>
                    </button>
                  </li>
                ))}

                {group?.plans.length === 0 && (
                  <li className="text-sm text-gray-400 py-2">
                    No plans assigned
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </aside>

      {/* PLANS */}
      <aside className="w-110 bg-gray-50 p-4 border-r overflow-auto">
        <h3 className="font-bold mb-4">Plans Library</h3>

        {/* Create new plan */}
        <div className="mb-4">
          <input
            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-2"
            placeholder="New plan name"
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
          />
          <button
            onClick={createPlan}
            className="w-full bg-indigo-600 text-white py-2 rounded-md text-sm hover:bg-indigo-700 transition"
          >
            Add Plan
          </button>
        </div>

        {plansLibrary.length === 0 && (
          <div className="text-gray-500 text-sm">No plans in library</div>
        )}

        {plansLibrary.length > 0 && (
          <ul className="w-full flex flex-col">
            {plansLibrary.map((p, index) => (
              <li
                key={p.id}
                onClick={() => {
                  if (editingPlanId) return;
                  setActivePlanId(p.id);
                }}
                className={`
            inline-flex items-center justify-between gap-x-2
            py-3 px-4 text-sm font-medium
            border border-gray-200 -mt-px
            cursor-pointer transition
            ${index === 0 ? "rounded-t-lg mt-0" : ""}
            ${index === plansLibrary.length - 1 ? "rounded-b-lg" : ""}
            ${
              activePlanId === p.id
                ? "bg-indigo-100 text-indigo-700"
                : "bg-white hover:bg-gray-100"
            }
          `}
              >
                {editingPlanId === p.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      className="flex-1 border border-gray-300 px-2 py-1 rounded text-sm"
                      value={newPlanNameEdit}
                      onChange={(e) => setNewPlanNameEdit(e.target.value)}
                    />
                    <button
                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        renamePlan(p.id);
                      }}
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="truncate">{p.name}</span>

                    <div className="flex gap-1">
                      <button
                        className="px-2 py-1 text-xs rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          clonePlan(p.id);
                        }}
                      >
                        <BookCopy className="cursor-pointer text-yellow-500 hover:text-yellow-700"></BookCopy>
                      </button>

                      <button
                        className="px-2 py-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlanId(p.id);
                          setNewPlanNameEdit(p.name);
                        }}
                      >
                        <PenLine className="cursor-pointer text-teal-500 hover:text-teal-700"></PenLine>
                      </button>

                      <button
                        className="px-2 py-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlan(p.id);
                        }}
                      >
                        <Delete className="cursor-pointer text-rose-500 hover:text-rose-700"></Delete>
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* MIDDLE-RIGHT: Test Cases Library */}
      <aside className="w-80 flex-1 p-6 overflow-auto bg-white">
        <h3 className="font-bold mb-6 text-lg">Test Cases Library</h3>

        <div className="flex justify-between items-center mb-4">
          <button
            disabled={selectedCases.length === 0}
            onClick={() => {
              const casesToAdd = tree
                .flatMap((g) => g.cases)
                .filter((tc) => selectedCases.includes(tc.id));

              casesToAdd.forEach((tc) => addCaseToPlan(tc));

              setSelectedCases([]);
            }}
            className="px-3 py-1 bg-green-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Add Selected ({selectedCases.length})
          </button>
        </div>

        <div role="tree" className="space-y-2">
          {tree.map((group) => {
            const isExpanded = expandedGroups[group.id] ?? false;

            return (
              <div key={group.id} role="treeitem" aria-expanded={isExpanded}>
                {/* ===== GROUP HEADER ===== */}
                <div className="flex items-center justify-between pr-2">
                  <div className="flex items-center gap-x-1">
                    {/* Toggle Button */}
                    <button
                      onClick={() =>
                        setExpandedGroups((prev) => ({
                          ...prev,
                          [group.id]: !isExpanded,
                        }))
                      }
                      className="size-6 flex justify-center items-center rounded-md hover:bg-gray-100 transition"
                    >
                      <svg
                        className={`size-3 transition-transform duration-200 ${
                          isExpanded ? "rotate-90" : ""
                        }`}
                        viewBox="0 0 16 16"
                        fill="currentColor"
                      >
                        <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                      </svg>
                    </button>

                    <span className="text-sm font-medium text-gray-800">
                      {group.name}
                    </span>
                  </div>

                  <input
                    type="checkbox"
                    checked={
                      group.cases.length > 0 &&
                      group.cases.every((c) => selectedCases.includes(c.id))
                    }
                    onChange={() => toggleGroup(group.id)}
                    className="size-4"
                  />
                </div>

                {/* ===== COLLAPSE ===== */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? "max-h-96 mt-1" : "max-h-0"
                  }`}
                  role="group"
                >
                  <div className="ml-3 pl-4 relative before:absolute before:top-0 before:left-0 before:h-full before:border-l before:border-gray-300">
                    {group.cases.map((tc) => (
                      <div
                        key={tc.id}
                        role="treeitem"
                        className="px-2 py-1 rounded-md hover:bg-gray-100 transition flex justify-between items-center"
                      >
                        <span className="text-sm text-gray-700">
                          {tc.title}
                        </span>

                        <input
                          type="checkbox"
                          checked={selectedCases.includes(tc.id)}
                          onChange={() => toggleCase(tc.id)}
                          className="size-4"
                        />
                      </div>
                    ))}

                    {group.cases.length === 0 && (
                      <div className="px-2 py-1 text-sm text-gray-400">
                        No test cases
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* RIGHT: Plan Content */}
      <aside className="w-90 p-6 bg-gray-50 border-l overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Plan Content</h3>
          <div className="text-xs text-gray-500">
            Plan ID: {activePlanId ?? "-"}
          </div>
        </div>

        {planCases.length === 0 && (
          <div className="text-gray-400">No tests in plan</div>
        )}
        {planCases.length > 0 && (
          <div className="flex justify-between items-center mb-4">
            <button
              disabled={selectedPlanCases.length === 0}
              onClick={() => {
                selectedPlanCases.forEach((id) => removeCaseFromPlan(id));
                setSelectedPlanCases([]);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Remove ({selectedPlanCases.length})
            </button>
          </div>
        )}

        {planCases.length > 0 && (
          <div role="tree" className="space-y-2">
            {Object.entries(
              planCases.reduce((acc: Record<string, any[]>, tc) => {
                const groupName = tc.name || "Ungrouped";
                if (!acc[groupName]) acc[groupName] = [];
                acc[groupName].push(tc);
                return acc;
              }, {}),
            ).map(([groupName, cases]) => {
              const isExpanded: boolean =
                expandedGroups[groupName as string] ?? true;

              return (
                <div key={groupName} role="treeitem" aria-expanded={isExpanded}>
                  {/* ===== GROUP HEADER ===== */}
                  <div className="flex items-center justify-between pr-2">
                    <div className="flex items-center gap-x-1">
                      <button
                        onClick={() =>
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [groupName]: !isExpanded,
                          }))
                        }
                        className="size-6 flex justify-center items-center rounded-md hover:bg-gray-200 transition"
                      >
                        <svg
                          className={`size-3 transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                        </svg>
                      </button>

                      <span className="text-sm font-medium text-gray-800">
                        {groupName}
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={
                        cases.length > 0 &&
                        cases.every((c) => selectedPlanCases.includes(c.id))
                      }
                      onChange={() => togglePlanGroup(groupName, cases)}
                      className="size-4"
                    />
                  </div>

                  {/* ===== COLLAPSE ===== */}
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? "max-h-96 mt-1" : "max-h-0"
                    }`}
                    role="group"
                  >
                    <div className="ml-3 pl-4 relative before:absolute before:top-0 before:left-0 before:h-full before:border-l before:border-gray-300">
                      {cases.map((tc) => (
                        <div
                          key={tc.id}
                          role="treeitem"
                          className="px-2 py-1 rounded-md hover:bg-gray-200 transition flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-700">
                            {tc.title}
                          </span>

                          <input
                            type="checkbox"
                            checked={selectedPlanCases.includes(tc.id)}
                            onChange={() => togglePlanCase(tc.id)}
                            className="size-4"
                          />
                        </div>
                      ))}

                      {cases.length === 0 && (
                        <div className="px-2 py-1 text-sm text-gray-400">
                          No test cases in this group
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
