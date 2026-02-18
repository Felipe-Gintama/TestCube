// import { useEffect, useState } from "react";

// export default function TestingPage() {
//   return (
//     <main className="min-h-screen bg-gray-200">
//       <div className="p-2 min-h-screen flex">
//         {/*Panel*/}
//         <div className="flex-[2] bg-red-200 flex flex-col">
//           <div className="m-2 flex-[1] bg-green-200">POLE WYBORU WYDAŃ</div>
//           <div className="m-2 flex-[2] bg-green-200">DRZEWO TESTÓW</div>
//         </div>

//         {/*testing cases*/}
//         <div className="flex-[4] bg-blue-200 flex">
//           <div className="m-2 flex-[1] bg-green-300">
//             PRZYPISANIE TESTÓW DO UŻYTKOWNIKA I WYKONANIE
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

import { useEffect, useState } from "react";
import { TestTree } from "../components/TestTree/testTree"; // Twój komponent
import type { TestGroupNode, TestCaseItem } from "../types/testTree";
import { fetchFullTree, fetchFullTreeForRun } from "../api/testCases";
import { buildTestTree } from "../utils/buildTestTree";
import { useApi } from "../hooks/apiFetch";
import { useAuth } from "../auth/AuthContext";

const statusBgMap: Record<string, string> = {
  BLOCKED: "bg-blue-200",
  OK: "bg-green-200",
  NOK: "bg-red-200",
  untested: "bg-gray-100",
};

type TestRun = {
  test_run_id: number;
  version: string;
  test_plan_id: number;
  plan_name: string;
  release_version: string;
};

interface Release {
  id: number;
  projectId: number;
  version: string;
}

interface ReleaseGroup {
  releaseId: number;
  releaseVersion: string;
  plans: { id: number; name: string }[];
}

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Plan = {
  id: number;
  name: string;
  releaseId: number;
};

export default function TestingPage() {
  // -----------------------------
  // UI State
  // -----------------------------
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [releases, setReleases] = useState<{ id: number; version: string }[]>(
    [],
  );
  const [activeReleaseId, setActiveReleaseId] = useState<number | null>(null);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);

  const [runsForTree, setRunsForTree] = useState<TestRun[]>([]);
  const [availableRuns, setAvailableRuns] = useState<TestRun[]>([]);
  const [availableRunsForUser, setAvailableRunsForUser] = useState<TestRun[]>(
    [],
  );
  type TestStatus = "untested" | "OK" | "NOK" | "BLOCKED" | "any";
  const allStatuses: TestStatus[] = ["untested", "OK", "NOK", "BLOCKED"];
  //FILTERS
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [activeUser, setActiveUser] = useState<number | null>(null);
  const [activeState, setActiveState] = useState<TestStatus[]>([
    ...allStatuses,
  ]);

  const [selectedRun, setSelectedRun] = useState<number | null>(null);

  //const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  //const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | "">("");
  const [selectedUserToAssignTests, setSelectedUserToAssignTests] = useState<
    number | ""
  >("");

  const [userRuns, setUserRuns] = useState<
    {
      test_run_id: number;
      test_plan_id: number;
      test_plan_name: string;
      release_version: string;
    }[]
  >([]);

  const [selectedTest, setSelectedTest] = useState<TestCaseItem | null>(null);
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);

  const [tree, setTree] = useState<TestGroupNode[]>([]);
  const [assignedTests, setAssignedTests] = useState<TestCaseItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type SelectedNode =
    | { type: "group"; node?: TestGroupNode | null }
    | { type: "test"; node?: TestCaseItem | null };

  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);

  interface Props {
    selectedNode:
      | { type: "group"; node?: TestGroupNode }
      | { type: "test"; node?: TestCaseItem }
      | null;
  }

  interface CheckedState {
    groups: Record<number, boolean>;
    tests: Record<number, boolean>;
  }

  const statusBgMap: { [key: string]: string } = {
    OK: "bg-emerald-200",
    NOK: "bg-rose-200",
    BLOCKED: "bg-blue-200",
    untested: "bg-white-200",
  };
  const { apiFetch } = useApi(); // albo tylko apiFetch jeśli user jest w useAuth
  const { user, login, logout } = useAuth();

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await apiFetch("http://localhost:4000/api/auth/me"); // apiFetch używa tokena z Context
        // zaktualizuj user w Context, jeśli trzeba
        login(localStorage.getItem("token")!, res.user);
      } catch (err: any) {
        console.error(err);
        // jeśli 401, możesz wylogować użytkownika
        logout();
      }
    }

    if (!user) {
      loadMe();
    }
  }, []);

  /*MOJE FUNKCJE*/
  //---------------------------------------------------------------------------------------------------------------------

  useEffect(() => {
    async function loadRuns() {
      try {
        const res = await apiFetch(
          "http://localhost:4000/api/test_runs/getAll",
        );
        console.log("runs: ", res);
        setAvailableRuns(res);
        setRunsForTree(res);
      } catch (e) {
        console.error(e);
        setAvailableRuns([]);
        setRunsForTree([]);
      }
    }
    loadRuns();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    async function fetchData() {
      try {
        const [usersRes] = await Promise.all([
          fetch("http://localhost:4000/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const usersData = await usersRes.json();
        setUsers(usersData);
        console.log("user obiekt => " + user);
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
  }, []);

  useEffect(() => {
    async function loadRunsForUser() {
      console.log("user => " + user?.id);
      if (!user?.id) return;
      try {
        const res = await apiFetch(
          `http://localhost:4000/api/test_runs/getAll/${user?.id}`,
        );
        setAvailableRunsForUser(res);
        //setRunsForTree(res);
        console.log("runs for user: ", res);
      } catch (e) {
        console.error(e);
        setAvailableRunsForUser([]);
        //setRunsForTree([]);
      }
    }
    loadRunsForUser();
  }, [user?.id]);

  async function startNewRun() {
    if (!activeReleaseId || !activePlanId) return;

    try {
      setLoading(true);

      await apiFetch(
        `http://localhost:4000/api/test_runs/start_run/${activeReleaseId}/${activePlanId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  async function StopRun() {
    if (!activeRunId) return;

    const confirmed = window.confirm(
      "Are you sure to finish test run?\nYou are not to able continue this run.",
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      await apiFetch(
        `http://localhost:4000/api/test_runs/${activeRunId}/finish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );

      alert("Test run has been finished!");

      //await FetchTreeForRun();
      //setSelectedNode(null);
      //setSelectedTestIds([]);
    } catch (err: any) {
      console.error(err);
      alert(err.message ?? "Błąd podczas kończenia biegu");
    } finally {
      setLoading(false);
    }
  }

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

  // async function loadProjects() {
  //   try {
  //     setLoading(true);
  //     const data = await apiFetch("http://localhost:4000/api/projects");
  //     setProjects(data);
  //     // if (data.length > 0) {
  //     //   setActiveProjectId((prev) => prev ?? data[0].id);
  //     // }
  //   } catch (err: any) {
  //     console.error(err);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  // useEffect(() => {
  //   loadProjects();
  // }, []);
  async function loadProjects() {
    try {
      setLoading(true);
      const data = await apiFetch("http://localhost:4000/api/projects/");
      console.log("projects api response:", data);

      setProjects(Array.isArray(data) ? data : (data.projects ?? []));
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      setProjects([]); // fallback
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!activeProjectId) {
      setReleases([]);
      setPlans([]);
      setActiveReleaseId(null);
      setActivePlanId(null);
      return;
    }

    //setActiveReleaseId(null);
    //setActivePlanId(null);
    //setPlans([]);

    loadReleases();
  }, [activeProjectId]);

  async function loadReleases() {
    try {
      setLoading(true);
      console.log("project id => " + activeProjectId);
      const data = await apiFetch(
        `http://localhost:4000/api/releases/${activeProjectId}`,
      );
      console.log("data releases => " + data);
      setReleases(data);
      console.log("releases => => " + releases);
      // setActiveReleaseId((prev) =>
      //   data.find((r: Release) => r.id === prev) ? prev : data[0]?.id ?? null
      // );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // useEffect(() => {
  //   if (!activeProjectId) {
  //     setReleases([]);
  //     setActiveReleaseId(null);
  //     return;
  //   }

  //   loadReleases();
  // }, [activeProjectId]);

  // async function loadPlansGrouped() {
  //   try {
  //     console.log("plan id => " + activeProjectId);
  //     setLoading(true);
  //     const data = await apiFetch(
  //       `http://localhost:4000/api/test_plans/${activeProjectId}`,
  //     );
  //     setPlans(data);
  //     console.log("plans => ", data);
  //   } catch (err: any) {
  //     console.error("loadPlansGrouped error:", err);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  async function loadPlansForRelease() {
    if (!activeReleaseId) return;

    try {
      setLoading(true);

      const data = await apiFetch(
        `http://localhost:4000/api/test_plans/${activeReleaseId}/plans`,
      );

      setPlans(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // if (!activeProjectId) {
    //   setPlans([]);
    //   return;
    // }
    console.log("activeProjectId => " + activeProjectId);
    console.log("ACTIVE RELEASE:", activeReleaseId);
    if (!activeReleaseId) {
      setPlans([]);
      setActiveReleaseId(null);
      return;
    }
    loadPlansForRelease();
    //setPlanCases([]);
    //setActivePlanId(null);
  }, [activeReleaseId]);

  async function AddUserToRun() {
    try {
      await apiFetch(`http://localhost:4000/api/test_runs/addUser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser,
          runId: selectedRun,
        }),
      });
    } catch (err: any) {
      console.error("loadPlansGrouped error:", err);
      setError(err.message);
    }
  }

  const token = localStorage.getItem("token");

  // if (activeRunId !== null){

  // }

  // async function FetchTreeForRun() {
  //   useEffect(() => {
  //     if (!token) return;
  //     fetchFullTreeForRun(projectId, activeRunId, token)
  //       .then((rows) => setTree(buildTestTree(rows)))
  //       .catch(console.error);
  //   }, [token]);
  // }
  const countStatuses = (nodes: TestGroupNode[]) => {
    const counts: Record<string, number> = {
      OK: 0,
      NOK: 0,
      BLOCKED: 0,
      untested: 0,
    };

    const walk = (groups: TestGroupNode[]) => {
      for (const g of groups) {
        for (const c of g.cases ?? []) {
          const status = c.status ?? "untested";
          if (counts[status] !== undefined) {
            counts[status]++;
          }
        }
        if (g.children?.length) {
          walk(g.children);
        }
      }
    };

    walk(nodes);
    return counts;
  };

  const FetchTreeForRun = async () => {
    if (!token) return;
    if (activeRunId === null) return;
    console.log("active user: ", activeUser);
    try {
      setLoading(true);
      const rows = await fetchFullTreeForRun(
        activeRunId,
        token,
        activeUser,
        activeState,
      );
      setTree(buildTestTree(rows));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = countStatuses(tree);
  type TestItemProps = {
    test: TestCaseItem;
    checked: boolean;
    onToggle: (id: number) => void;
  };

  function TestItem({ test, checked, onToggle }: TestItemProps) {
    const onTestWindowClosed = async () => {
      await FetchTreeForRun();
    };
    const openTestWindow = () => {
      const width = 900;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const win = window.open(
        `/execute-test/${test.id}/${activeRunId}`,
        `test-${test.id}`,
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      const interval = setInterval(() => {
        if (!win || win.closed) {
          clearInterval(interval);
          onTestWindowClosed();
        }
      }, 500);
    };
    const bgClass = statusBgMap[test.status ?? ""] ?? "bg-white";

    return (
      <div className={`flex items-center gap-2 mb-1 p-1 rounded ${bgClass}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(test.id)}
        />
        <span>Name: {test.title} |</span>
        <span>Status: {test.status} |</span>
        <span>Assigned to: {test.assigned_to_name ?? "unassigned"}</span>

        <button
          onClick={openTestWindow}
          className="ml-auto px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Do test
        </button>
      </div>
    );
  }

  function SelectedNodeViewer({
    selectedNode,
    selectedTestIds,
    setSelectedTestIds,
  }: {
    selectedNode: SelectedNode | null;
    selectedTestIds: number[];
    setSelectedTestIds: React.Dispatch<React.SetStateAction<number[]>>;
  }) {
    //const [selectedTestIds, setSelectedTestIds] = useState<number[]>([]);
    const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});

    const toggleGroupOpen = (id: number) => {
      setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleCheckTest = (id: number) => {
      setSelectedTestIds((prev) =>
        prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id],
      );
    };

    const toggleCheckGroup = (group: TestGroupNode) => {
      const ids = group.cases?.map((c) => c.id) ?? [];

      setSelectedTestIds((prev) => {
        const allSelected = ids.every((id) => prev.includes(id));
        return allSelected
          ? prev.filter((id) => !ids.includes(id))
          : [...new Set([...prev, ...ids])];
      });
    };

    const flattenGroups = (groups: TestGroupNode[]): TestGroupNode[] => {
      let result: TestGroupNode[] = [];
      groups.forEach((g) => {
        result.push(g);
        if (g.children?.length) {
          result = result.concat(flattenGroups(g.children));
        }
      });
      return result;
    };

    if (!selectedNode) return <p>No node selected</p>;

    if (selectedNode.type === "test" && selectedNode.node) {
      return (
        <TestItem
          test={selectedNode.node}
          checked={selectedTestIds.includes(selectedNode.node.id)}
          onToggle={toggleCheckTest}
        />
      );
    }

    if (selectedNode.type === "group" && selectedNode.node) {
      const groupsToRender = flattenGroups([selectedNode.node]);

      return (
        <>
          {groupsToRender.map((group) => {
            const isExpanded = openGroups[group.id] ?? true;
            const groupChecked =
              group.cases?.length &&
              group.cases.every((c) => selectedTestIds.includes(c.id));

            return (
              <div
                key={group.id}
                className="bg-white rounded-lg shadow overflow-hidden mb-6"
              >
                {/* ===== HEADER GROUP ===== */}
                <div
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-t from-emerald-600 to-emerald-800 text-white cursor-pointer rounded-t-lg"
                  onClick={() =>
                    setOpenGroups((prev) => ({
                      ...prev,
                      [group.id]: !isExpanded,
                    }))
                  }
                >
                  {/* Toggle Button */}
                  <button className="w-6 h-6 flex justify-center items-center rounded-md hover:bg-gray-100 transition">
                    <svg
                      className={`w-3 h-3 transition-transform duration-200 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
                    </svg>
                  </button>

                  <input
                    type="checkbox"
                    checked={!!groupChecked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleCheckGroup(group)}
                  />

                  <span className="font-bold uppercase text-sm">
                    {group.name}
                  </span>
                </div>

                {/* ===== COLLAPSIBLE TABLE ===== */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isExpanded ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-start text-xs font-medium text-gray-600 uppercase">
                            Test ID
                          </th>
                          <th className="px-6 py-3 text-start text-xs font-medium text-gray-600 uppercase">
                            Test Name
                          </th>
                          <th className="px-6 py-3 text-start text-xs font-medium text-gray-600 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-end text-xs font-medium text-gray-600 uppercase">
                            Select
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {group.cases.map((test, i) => (
                          <tr
                            key={test.id}
                            className={`${i % 2 === 0 ? "bg-gray-50" : "bg-gray-100"} hover:bg-gray-200`}
                          >
                            {/* Wiersz TestItem */}
                            <TestItem
                              test={test}
                              checked={selectedTestIds.includes(test.id)}
                              onToggle={toggleCheckTest}
                            />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      );
    }

    return null;
  }

  //--------------------------------------------
  const assignTestsToUser = async () => {
    if (!activeRunId) {
      alert("Select test run");
      return;
    }

    if (!selectedUserToAssignTests) {
      alert("Select user");
      return;
    }

    if (selectedTestIds.length === 0) {
      alert("No tests selected");
      return;
    }

    try {
      await apiFetch("http://localhost:4000/api/test_runs/assignUserToTests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: activeRunId,
          userId: selectedUserToAssignTests,
          testIds: selectedTestIds,
        }),
      });

      alert("Tests assigned successfully");
    } catch (err) {
      console.error(err);
      alert("Failed to assign tests");
    }
  };

  const removeAssignments = async () => {
    if (!activeRunId) {
      alert("Select test run");
      return;
    }

    if (selectedTestIds.length === 0) {
      alert("No tests selected");
      return;
    }

    try {
      await apiFetch("http://localhost:4000/api/test_runs/removeAssignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: activeRunId,
          testIds: selectedTestIds,
        }),
      });

      alert("removed assignments");
    } catch (err) {
      console.error(err);
      alert("Failed to removed assignments tests");
    }
  };

  //const statuses: TestStatus[] = ["untested", "OK", "NOK", "BLOCKED"];

  // -----------------------------
  // Render
  // -----------------------------
  return (
    // <main className="min-h-screen bg-gray-200 p-2">
    //   <div className="flex gap-2 min-h-screen">
    //     {/* LEFT PANEL */}
    //     <div className="flex-[2] bg-white flex flex-col gap-2 p-2 overflow-auto">
    //       {/* Run selection panel */}
    //       <div className="bg-green-200 p-2 rounded">
    //         <h3 className="font-bold mb-1">Start New Test Run</h3>

    //         {/*----------------------projekty---------------------------------------*/}
    //         <div>
    //           <select
    //             value={activeProjectId ?? ""}
    //             onChange={(e) => setActiveProjectId(Number(e.target.value))}
    //           >
    //             <option value="">Select Project</option>
    //             {projects.map((p) => (
    //               <option key={p.id} value={p.id}>
    //                 {p.name}
    //               </option>
    //             ))}
    //           </select>
    //         </div>

    //         {/*----------------------releases---------------------------------------*/}
    //         <div className="mt-1">
    //           <select
    //             value={activeReleaseId ?? ""}
    //             onChange={(e) => {
    //               const releaseId = Number(e.target.value);
    //               setActiveReleaseId(releaseId);
    //               // if (releaseId && activePlanId) {
    //               //   loadRunsForReleaseAndPlan(releaseId, activePlanId);
    //               // }
    //             }}
    //           >
    //             <option value="">Select Release</option>
    //             {releases.map((r) => (
    //               <option key={r.id} value={r.id}>
    //                 {r.version}
    //               </option>
    //             ))}
    //           </select>
    //         </div>

    //         {/*----------------------plans---------------------------------------*/}
    //         <div className="mt-1">
    //           <select
    //             value={activePlanId ?? ""}
    //             onChange={(e) => {
    //               console.log("SELECTED RELEASE:", e.target.value);
    //               setActivePlanId(Number(e.target.value));
    //             }}
    //           >
    //             <option value="">Select Plan</option>

    //             {plans.map((p) => (
    //               <option key={p.id} value={p.id}>
    //                 {p.name}
    //               </option>
    //             ))}
    //           </select>
    //         </div>

    //         {/* Existing runs dropdown */}
    //         {/* {runsForTree.length > 0 && (
    //           <div className="mt-2">
    //             <select
    //               value={activeRunId ?? ""}
    //               onChange={(e) => handleSelectRun(Number(e.target.value))}
    //             >
    //               <option value="">Select Active Run</option>
    //               {availableRuns.map((r) => (
    //                 <option key={r.id} value={r.id}>
    //                   {r.name} ({r.status})
    //                 </option>
    //               ))}
    //             </select>
    //           </div>
    //         )} */}

    //         <button
    //           className="p-2 bg-green-500 text-white rounded hover:bg-green-600 mt-2"
    //           onClick={() => startNewRun()}
    //         >
    //           Start New Test Run
    //         </button>
    //       </div>

    //       {/* Users / assign to run panel */}
    //       <div className="bg-green-200 p-2 rounded mt-2">
    //         <h4 className="font-bold mb-1">Assign User to Run</h4>
    //         <div className="mt-2">
    //           <select
    //             value={selectedRun ?? ""}
    //             onChange={(e) => setSelectedRun(Number(e.target.value))}
    //           >
    //             <option value="">Select Run</option>
    //             {availableRuns.map((r) => (
    //               <option key={r.test_run_id} value={r.test_run_id}>
    //                 {r.plan_name} ({r.release_version})
    //               </option>
    //             ))}
    //           </select>
    //         </div>
    //         <div>
    //           <select
    //             value={selectedUser ?? ""}
    //             onChange={(e) => setSelectedUser(Number(e.target.value))}
    //           >
    //             <option value="">Select User</option>
    //             {users.map((u) => (
    //               <option key={u.id} value={u.id}>
    //                 {u.name}
    //               </option>
    //             ))}
    //           </select>
    //         </div>
    //         <button
    //           onClick={() => AddUserToRun()}
    //           className="mt-2 p-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
    //         >
    //           Add user
    //         </button>
    //       </div>

    //       {/*--------------- test runs -------------------*/}
    //       <div className="bg-green-200 p-2 rounded mt-2">
    //         <h4 className="font-bold mb-1">Test runs</h4>
    //         <div className="mt-2">
    //           <select
    //             value={activeRunId ?? ""}
    //             onChange={(e) => setActiveRunId(Number(e.target.value))}
    //           >
    //             <option value="">Select Run</option>
    //             {availableRunsForUser.map((rt) => (
    //               <option key={rt.test_run_id} value={rt.test_run_id}>
    //                 {"ID: " + rt.test_run_id} {rt.plan_name}{" "}
    //                 {rt.release_version}
    //               </option>
    //             ))}
    //           </select>
    //         </div>
    //         {/* <div>
    //           <select
    //             value={activeUser === -1 ? "" : activeUser ?? ""}
    //             onChange={(e) => {
    //               const val = e.target.value;
    //               setActiveUser(val === "" ? -1 : Number(val));
    //             }}
    //           >
    //             <option value="">Nikt</option>
    //             {users.map((u) => (
    //               <option key={u.id} value={u.id}>
    //                 {u.name}
    //               </option>
    //             ))}
    //           </select>
    //         </div> */}
    //         <select
    //           value={activeUser ?? ""} // null pokazuje pustą opcję dla dowolnego
    //           onChange={(e) => {
    //             const val = e.target.value;
    //             if (val === "")
    //               setActiveUser(null); // dowolny
    //             else if (val === "-1")
    //               setActiveUser(-1); // nikt
    //             else setActiveUser(Number(val)); // konkretny użytkownik
    //           }}
    //         >
    //           <option value="">Dowolny</option>
    //           <option value="-1">Nikt</option>
    //           {users.map((u) => (
    //             <option key={u.id} value={u.id}>
    //               {u.name}
    //             </option>
    //           ))}
    //         </select>
    //         <div>
    //           <select
    //             value={
    //               activeState.length === allStatuses.length
    //                 ? "any"
    //                 : activeState[0]
    //             }
    //             onChange={(e) => {
    //               const value = e.target.value;
    //               if (value === "any") {
    //                 setActiveState([...allStatuses]);
    //               } else {
    //                 setActiveState([value as TestStatus]);
    //               }
    //             }}
    //           >
    //             <option value="any">All</option>
    //             {allStatuses.map((status) => (
    //               <option key={status} value={status}>
    //                 {status}
    //               </option>
    //             ))}
    //           </select>
    //         </div>
    //         <button
    //           onClick={() => FetchTreeForRun()}
    //           className="p-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
    //         >
    //           Show tests
    //         </button>
    //         <button
    //           onClick={() => StopRun()}
    //           className="p-2 bg-violet-500 text-white rounded hover:bg-violet-600 ml-2 "
    //         >
    //           Stop Run
    //         </button>

    //         <div className="text-sm text-gray-600">
    //           Zalogowany jako: <b>{user?.email}</b> | <b>{user?.name}</b> |{" "}
    //           <b>ID: {user?.id}</b> | <b>{user?.role}</b>
    //         </div>
    //       </div>

    //       {/* TestTree - only render if run is selected */}

    //       <div className="bg-green-200 p-2 rounded flex-1 overflow-auto mt-2">
    //         <div className="flex gap-3 mb-2">
    //           <div className="px-2 py-1 rounded bg-green-500 text-white text-sm">
    //             OK: {statusCounts.OK}
    //           </div>
    //           <div className="px-2 py-1 rounded bg-red-500 text-white text-sm">
    //             NOK: {statusCounts.NOK}
    //           </div>
    //           <div className="px-2 py-1 rounded bg-blue-500 text-white text-sm">
    //             BLOCKED: {statusCounts.BLOCKED}
    //           </div>
    //           <div className="px-2 py-1 rounded bg-gray-400 text-white text-sm">
    //             untested: {statusCounts.untested}
    //           </div>
    //         </div>
    //         <h3 className="font-bold mb-1">Test Tree</h3>
    //         <TestTree
    //           nodes={tree}
    //           forceOpen={false}
    //           onSelectGroup={(node) => {
    //             console.log("Clicked group node:", node);
    //             if (node) setSelectedNode({ type: "group", node });
    //           }}
    //           onSelectTestCase={(node) => {
    //             console.log("Clicked test node:", node);
    //             if (node) setSelectedNode({ type: "test", node });
    //           }}
    //         />
    //       </div>
    //     </div>

    //     {/* RIGHT PANEL */}
    //     <div className="flex-[4] bg-blue-200 flex flex-col p-2 gap-2 overflow-auto">
    //       <div className="bg-green-300 p-2 rounded flex-1 overflow-auto">
    //         <h3 className="font-bold mb-2">Assigned Tests & Execution</h3>
    //         <div className="bg-white p-2 rounded shadow mt-2">
    //           Przypisz testy
    //           <div className="bg-gray-300 rounded">
    //             <select
    //               value={selectedUserToAssignTests ?? ""}
    //               onChange={(e) =>
    //                 setSelectedUserToAssignTests(Number(e.target.value))
    //               }
    //             >
    //               <option value="">Select User</option>
    //               {users.map((u) => (
    //                 <option key={u.id} value={u.id}>
    //                   {u.name}
    //                 </option>
    //               ))}
    //             </select>
    //             <button
    //               onClick={assignTestsToUser}
    //               className="p-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
    //             >
    //               assign tests to user
    //             </button>
    //             <button
    //               onClick={removeAssignments}
    //               className="p-2 bg-red-500 text-white rounded hover:bg-red-600 ml-2"
    //             >
    //               Remove Assignments
    //             </button>
    //           </div>
    //         </div>
    //         <div className="bg-white p-2 rounded shadow mt-2">
    //           <h4 className="font-bold mb-2"></h4>
    //           <SelectedNodeViewer
    //             selectedNode={selectedNode}
    //             selectedTestIds={selectedTestIds}
    //             setSelectedTestIds={setSelectedTestIds}
    //           />
    //         </div>
    //       </div>
    //     </div>

    //     {/**/}
    //   </div>
    // </main>
    // <main className="min-h-screen bg-gray-50 p-4">
    //   <div className="flex gap-4 min-h-screen">
    //     {/* LEWY PANEL */}
    //     <div className="flex-[2] bg-white rounded-xl shadow p-4 flex flex-col gap-4 overflow-auto">
    //       {/* Start nowego test run */}
    //       <div className="bg-green-100 p-4 rounded-xl">
    //         <h3 className="font-bold mb-3 text-gray-800">
    //           Rozpocznij nowy test run
    //         </h3>

    //         <select
    //           value={activeProjectId ?? ""}
    //           onChange={(e) => setActiveProjectId(Number(e.target.value))}
    //           className="w-full p-2 rounded-full border border-gray-300 mb-2 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="">Wybierz projekt</option>
    //           {projects.map((p) => (
    //             <option key={p.id} value={p.id}>
    //               {p.name}
    //             </option>
    //           ))}
    //         </select>

    //         <select
    //           value={activeReleaseId ?? ""}
    //           onChange={(e) => setActiveReleaseId(Number(e.target.value))}
    //           className="w-full p-2 rounded-full border border-gray-300 mb-2 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="">Wybierz wersję</option>
    //           {releases.map((r) => (
    //             <option key={r.id} value={r.id}>
    //               {r.version}
    //             </option>
    //           ))}
    //         </select>

    //         <select
    //           value={activePlanId ?? ""}
    //           onChange={(e) => setActivePlanId(Number(e.target.value))}
    //           className="w-full p-2 rounded-full border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="">Wybierz plan</option>
    //           {plans.map((p) => (
    //             <option key={p.id} value={p.id}>
    //               {p.name}
    //             </option>
    //           ))}
    //         </select>

    //         <button
    //           onClick={startNewRun}
    //           className="w-full p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
    //         >
    //           Rozpocznij nowy test run
    //         </button>
    //       </div>

    //       {/* Przypisz użytkownika do run */}
    //       <div className="bg-green-100 p-4 rounded-xl">
    //         <h3 className="font-bold mb-3 text-gray-800">
    //           Przypisz użytkownika do run
    //         </h3>

    //         <select
    //           value={selectedRun ?? ""}
    //           onChange={(e) => setSelectedRun(Number(e.target.value))}
    //           className="w-full p-2 rounded-full border border-gray-300 mb-2 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="">Wybierz run</option>
    //           {availableRuns.map((r) => (
    //             <option key={r.test_run_id} value={r.test_run_id}>
    //               {r.plan_name} ({r.release_version})
    //             </option>
    //           ))}
    //         </select>

    //         <select
    //           value={selectedUser ?? ""}
    //           onChange={(e) => setSelectedUser(Number(e.target.value))}
    //           className="w-full p-2 rounded-full border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="">Wybierz użytkownika</option>
    //           {users.map((u) => (
    //             <option key={u.id} value={u.id}>
    //               {u.name}
    //             </option>
    //           ))}
    //         </select>

    //         <button
    //           onClick={AddUserToRun}
    //           className="w-full p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
    //         >
    //           Dodaj użytkownika
    //         </button>
    //       </div>

    //       {/* Test runy */}
    //       <div className="bg-green-100 p-4 rounded-xl">
    //         <h3 className="font-bold mb-3 text-gray-800">Test runy</h3>

    //         <select
    //           value={activeRunId ?? ""}
    //           onChange={(e) => setActiveRunId(Number(e.target.value))}
    //           className="w-full p-2 rounded-full border border-gray-300 mb-2 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="">Wybierz run</option>
    //           {availableRunsForUser.map((rt) => (
    //             <option key={rt.test_run_id} value={rt.test_run_id}>
    //               ID: {rt.test_run_id} | {rt.plan_name} | {rt.release_version}
    //             </option>
    //           ))}
    //         </select>

    //         <select
    //           value={activeUser ?? ""}
    //           onChange={(e) => {
    //             const val = e.target.value;
    //             if (val === "") setActiveUser(null);
    //             else if (val === "-1") setActiveUser(-1);
    //             else setActiveUser(Number(val));
    //           }}
    //           className="w-full p-2 rounded-full border border-gray-300 mb-2 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="">Dowolny</option>
    //           <option value="-1">Nikt</option>
    //           {users.map((u) => (
    //             <option key={u.id} value={u.id}>
    //               {u.name}
    //             </option>
    //           ))}
    //         </select>

    //         <select
    //           value={
    //             activeState.length === allStatuses.length
    //               ? "any"
    //               : activeState[0]
    //           }
    //           onChange={(e) => {
    //             const val = e.target.value;
    //             if (val === "any") setActiveState([...allStatuses]);
    //             else setActiveState([val as TestStatus]);
    //           }}
    //           className="w-full p-2 rounded-full border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="any">Wszystkie</option>
    //           {allStatuses.map((status) => (
    //             <option key={status} value={status}>
    //               {status}
    //             </option>
    //           ))}
    //         </select>

    //         <div className="flex gap-2">
    //           <button
    //             onClick={FetchTreeForRun}
    //             className="flex-1 p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
    //           >
    //             Pokaż testy
    //           </button>
    //           <button
    //             onClick={StopRun}
    //             className="flex-1 p-2 bg-violet-500 text-white rounded-full hover:bg-violet-600 transition"
    //           >
    //             Zatrzymaj run
    //           </button>
    //         </div>

    //         <div className="text-sm text-gray-500 mt-2">
    //           Zalogowany jako: <b>{user?.name}</b> | <b>{user?.email}</b> | ID:{" "}
    //           <b>{user?.id}</b> | Rola: <b>{user?.role}</b>
    //         </div>
    //       </div>

    //       {/* Test Tree */}
    //       <div className="bg-green-100 p-4 rounded-xl flex-1 overflow-auto">
    //         <div className="flex gap-2 mb-3">
    //           <div className="px-3 py-1 rounded-full bg-green-500 text-white text-sm">
    //             OK: {statusCounts.OK}
    //           </div>
    //           <div className="px-3 py-1 rounded-full bg-red-500 text-white text-sm">
    //             NOK: {statusCounts.NOK}
    //           </div>
    //           <div className="px-3 py-1 rounded-full bg-blue-500 text-white text-sm">
    //             BLOCKED: {statusCounts.BLOCKED}
    //           </div>
    //           <div className="px-3 py-1 rounded-full bg-gray-400 text-white text-sm">
    //             untested: {statusCounts.untested}
    //           </div>
    //         </div>
    //         <h3 className="font-bold mb-2 text-gray-800">Test Tree</h3>
    //         <TestTree
    //           nodes={tree}
    //           forceOpen={false}
    //           onSelectGroup={(node) =>
    //             node && setSelectedNode({ type: "group", node })
    //           }
    //           onSelectTestCase={(node) =>
    //             node && setSelectedNode({ type: "test", node })
    //           }
    //         />
    //       </div>
    //     </div>

    //     {/* PRAWY PANEL */}
    //     <div className="flex-[4] bg-blue-50 rounded-xl shadow p-4 flex flex-col gap-4 overflow-auto">
    //       <div className="bg-green-100 p-4 rounded-xl flex-1 overflow-auto">
    //         <h3 className="font-bold mb-3 text-gray-800">
    //           Przypisane testy i wykonanie
    //         </h3>

    //         <select
    //           value={selectedUserToAssignTests ?? ""}
    //           onChange={(e) =>
    //             setSelectedUserToAssignTests(Number(e.target.value))
    //           }
    //           className="w-full p-2 rounded-full border border-gray-300 mb-3 focus:outline-none focus:ring-2 focus:ring-green-300"
    //         >
    //           <option value="">Wybierz użytkownika</option>
    //           {users.map((u) => (
    //             <option key={u.id} value={u.id}>
    //               {u.name}
    //             </option>
    //           ))}
    //         </select>

    //         <div className="flex gap-2 mb-3">
    //           <button
    //             onClick={assignTestsToUser}
    //             className="flex-1 p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
    //           >
    //             Przypisz testy
    //           </button>
    //           <button
    //             onClick={removeAssignments}
    //             className="flex-1 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
    //           >
    //             Usuń przypisania
    //           </button>
    //         </div>

    //         <div className="bg-white rounded-xl p-4 shadow">
    //           <SelectedNodeViewer
    //             selectedNode={selectedNode}
    //             selectedTestIds={selectedTestIds}
    //             setSelectedTestIds={setSelectedTestIds}
    //           />
    //         </div>
    //       </div>
    //     </div>
    //   </div>
    // </main>
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="flex gap-4 min-h-screen">
        {/* LEWY PANEL */}
        <div className="flex-[2] bg-white rounded-xl shadow p-4 flex flex-col gap-4 overflow-auto">
          {/* Start nowego test run */}
          <div className="bg-green-100 p-4 rounded-xl">
            <h3 className="font-bold mb-3 text-gray-800">
              Rozpocznij nowy test run
            </h3>

            <select
              value={activeProjectId ?? ""}
              onChange={(e) => setActiveProjectId(Number(e.target.value))}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Wybierz projekt</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={activeReleaseId ?? ""}
              onChange={(e) => setActiveReleaseId(Number(e.target.value))}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Wybierz wersję</option>
              {releases.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.version}
                </option>
              ))}
            </select>

            <select
              value={activePlanId ?? ""}
              onChange={(e) => setActivePlanId(Number(e.target.value))}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Wybierz plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={startNewRun}
              className="w-full p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
            >
              Rozpocznij nowy test run
            </button>
          </div>

          {/* Przypisz użytkownika do run */}
          <div className="bg-green-100 p-4 rounded-xl">
            <h3 className="font-bold mb-3 text-gray-800">
              Przypisz użytkownika do run
            </h3>

            <select
              value={selectedRun ?? ""}
              onChange={(e) => setSelectedRun(Number(e.target.value))}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Wybierz run</option>
              {availableRuns.map((r) => (
                <option key={r.test_run_id} value={r.test_run_id}>
                  {r.plan_name} ({r.release_version})
                </option>
              ))}
            </select>

            <select
              value={selectedUser ?? ""}
              onChange={(e) => setSelectedUser(Number(e.target.value))}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Wybierz użytkownika</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <button
              onClick={AddUserToRun}
              className="w-full p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
            >
              Dodaj użytkownika
            </button>
          </div>

          {/* Test runy */}
          <div className="bg-green-100 p-4 rounded-xl">
            <h3 className="font-bold mb-3 text-gray-800">Test runy</h3>

            <select
              value={activeRunId ?? ""}
              onChange={(e) => setActiveRunId(Number(e.target.value))}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Wybierz run</option>
              {availableRunsForUser.map((rt) => (
                <option key={rt.test_run_id} value={rt.test_run_id}>
                  ID: {rt.test_run_id} | {rt.plan_name} | {rt.release_version}
                </option>
              ))}
            </select>

            <select
              value={activeUser ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") setActiveUser(null);
                else if (val === "-1") setActiveUser(-1);
                else setActiveUser(Number(val));
              }}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Dowolny</option>
              <option value="-1">Nikt</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              value={
                activeState.length === allStatuses.length
                  ? "any"
                  : activeState[0]
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === "any") setActiveState([...allStatuses]);
                else setActiveState([val as TestStatus]);
              }}
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="any">Wszystkie</option>
              {allStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={FetchTreeForRun}
                className="flex-1 p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
              >
                Pokaż testy
              </button>
              <button
                onClick={StopRun}
                className="flex-1 p-2 bg-violet-500 text-white rounded-full hover:bg-violet-600 transition"
              >
                Zatrzymaj run
              </button>
            </div>

            <div className="text-sm text-gray-500 mt-2">
              Zalogowany jako: <b>{user?.name}</b> | <b>{user?.email}</b> | ID:{" "}
              <b>{user?.id}</b> | Rola: <b>{user?.role}</b>
            </div>
          </div>
          {/* TestTree */}
          <div className="bg-green-100 p-4 rounded-xl flex-1 overflow-auto mt-4">
            <div className="flex gap-3 mb-3">
              <div className="px-3 py-1 rounded bg-green-500 text-white text-sm">
                OK: {statusCounts.OK}
              </div>
              <div className="px-3 py-1 rounded bg-red-500 text-white text-sm">
                NOK: {statusCounts.NOK}
              </div>
              <div className="px-3 py-1 rounded bg-blue-500 text-white text-sm">
                BLOCKED: {statusCounts.BLOCKED}
              </div>
              <div className="px-3 py-1 rounded bg-gray-400 text-white text-sm">
                untested: {statusCounts.untested}
              </div>
            </div>

            <h3 className="font-bold mb-2 text-gray-800">Drzewo testów</h3>

            <TestTree
              nodes={tree}
              forceOpen={false}
              onSelectGroup={(node) => {
                console.log("Kliknięto grupę:", node);
                if (node) setSelectedNode({ type: "group", node });
              }}
              onSelectTestCase={(node) => {
                console.log("Kliknięto test:", node);
                if (node) setSelectedNode({ type: "test", node });
              }}
            />
          </div>
        </div>

        {/* PRAWY PANEL */}
        <div className="flex-[4] bg-blue-50 rounded-xl shadow p-4 flex flex-col gap-4 overflow-auto">
          <div className="bg-green-100 p-4 rounded-xl flex-1 overflow-auto">
            <h3 className="font-bold mb-3 text-gray-800">
              Przypisane testy i wykonanie
            </h3>

            <select
              value={selectedUserToAssignTests ?? ""}
              onChange={(e) =>
                setSelectedUserToAssignTests(Number(e.target.value))
              }
              className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm mb-3 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              <option value="">Wybierz użytkownika</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2 mb-3">
              <button
                onClick={assignTestsToUser}
                className="flex-1 p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
              >
                Przypisz testy
              </button>
              <button
                onClick={removeAssignments}
                className="flex-1 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
              >
                Usuń przypisania
              </button>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <SelectedNodeViewer
                selectedNode={selectedNode}
                selectedTestIds={selectedTestIds}
                setSelectedTestIds={setSelectedTestIds}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
