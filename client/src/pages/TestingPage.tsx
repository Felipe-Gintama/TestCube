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

export default function TestingPage() {
  // -----------------------------
  // UI State
  // -----------------------------
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const [releases, setReleases] = useState<{ id: number; version: string }[]>(
    []
  );
  const [activeReleaseId, setActiveReleaseId] = useState<number | null>(null);

  const [plans, setPlans] = useState<ReleaseGroup[]>([]);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);

  const [runsForTree, setRunsForTree] = useState<TestRun[]>([]);
  const [availableRuns, setAvailableRuns] = useState<TestRun[]>([]);
  const [availableRunsForUser, setAvailableRunsForUser] = useState<TestRun[]>(
    []
  );
  const [activeRunId, setActiveRunId] = useState<number | null>(null);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);

  //const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | "">("");

  const [userRuns, setUserRuns] = useState<
    {
      test_run_id: number;
      test_plan_id: number;
      test_plan_name: string;
      release_version: string;
    }[]
  >([]);

  const [selectedTest, setSelectedTest] = useState<TestCaseItem | null>(null);

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

  /*MOJE FUNKCJE*/
  //---------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    async function loadRuns() {
      try {
        const res = await apiFetch(
          "http://localhost:4000/api/test_runs/getAll"
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
    async function loadMe() {
      try {
        const res = await apiFetch("http://localhost:4000/api/auth/me");
        setUser(res.user);
      } catch (e) {
        console.error(e);
        setUser(null);
      }
    }
    loadMe();
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
          `http://localhost:4000/api/test_runs/getAll/${user?.id}`
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
        }
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  async function loadProjects() {
    try {
      setLoading(true);
      const data = await apiFetch("http://localhost:4000/api/projects");
      setProjects(data);
      // if (data.length > 0) {
      //   setActiveProjectId((prev) => prev ?? data[0].id);
      // }
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

  async function loadReleases() {
    try {
      setLoading(true);
      console.log("project id => " + activeProjectId);
      const data = await apiFetch(
        `http://localhost:4000/api/releases/${activeProjectId}`
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

  useEffect(() => {
    if (!activeProjectId) {
      setReleases([]);
      setActiveReleaseId(null);
      return;
    }

    loadReleases();
  }, [activeProjectId]);

  async function loadPlansGrouped() {
    try {
      console.log("plan id => " + activeProjectId);
      setLoading(true);
      const data = await apiFetch(
        `http://localhost:4000/api/test_plans/${activeProjectId}`
      );
      setPlans(data);
    } catch (err: any) {
      console.error("loadPlansGrouped error:", err);
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
    if (!activeProjectId) {
      setPlans([]);
      setActiveReleaseId(null);
      return;
    }
    loadPlansGrouped();
    //setPlanCases([]);
    //setActivePlanId(null);
  }, [activeProjectId]);

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
  const projectId = 1;

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

  const FetchTreeForRun = async () => {
    if (!token) return;
    if (activeRunId === null) return;

    try {
      setLoading(true);
      const rows = await fetchFullTreeForRun(activeRunId, token);
      setTree(buildTestTree(rows));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  type TestItemProps = {
    test: TestCaseItem;
    checked: boolean;
    onToggle: (id: number) => void;
  };

  function TestItem({ test, checked, onToggle }: TestItemProps) {
    return (
      <div className="flex items-center gap-2 mb-1 border p-1 rounded bg-white">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(test.id)}
        />
        <span>{test.title}</span>
        <span>{test.status}</span>
        <span>{test.assigned_to_name ?? "unassigned"}</span>
      </div>
    );
  }

  function SelectedNodeViewer({
    selectedNode,
  }: {
    selectedNode: SelectedNode | null;
  }) {
    const [checkedGroups, setCheckedGroups] = useState<Record<number, boolean>>(
      {}
    );
    const [checkedTests, setCheckedTests] = useState<Record<number, boolean>>(
      {}
    );
    const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});

    const toggleGroupOpen = (id: number) => {
      setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Funkcja do zaznaczenia wszystkich testów danej grupy
    const toggleCheckGroup = (group: TestGroupNode) => {
      const groupChecked = !(checkedGroups[group.id] ?? false);

      setCheckedGroups((prev) => ({ ...prev, [group.id]: groupChecked }));

      const newTests = { ...checkedTests };
      group.cases?.forEach((c) => {
        newTests[c.id] = groupChecked;
      });

      setCheckedTests(newTests);
    };

    const toggleCheckTest = (id: number) => {
      setCheckedTests((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const flattenGroups = (groups: TestGroupNode[]): TestGroupNode[] => {
      let result: TestGroupNode[] = [];
      groups.forEach((g) => {
        result.push(g);
        if (g.children && g.children.length > 0) {
          result = result.concat(flattenGroups(g.children));
        }
      });
      return result;
    };

    if (!selectedNode) return <p>No node selected</p>;

    // Pojedynczy test
    if (selectedNode.type === "test" && selectedNode.node) {
      return (
        <TestItem
          test={selectedNode.node}
          checked={checkedTests[selectedNode.node.id] ?? false}
          onToggle={toggleCheckTest}
        />
      );
    }

    // Grupa i jej testy
    if (selectedNode.type === "group" && selectedNode.node) {
      const groupsToRender = flattenGroups([selectedNode.node]);

      return (
        <>
          {groupsToRender.map((group) => {
            const isOpen = openGroups[group.id] ?? true;
            return (
              <div
                key={group.id}
                className="border p-2 rounded mb-2 bg-gray-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <button
                    className="font-bold"
                    onClick={() => toggleGroupOpen(group.id)}
                  >
                    {isOpen ? "▼" : "▶"}
                  </button>
                  <input
                    type="checkbox"
                    checked={checkedGroups[group.id] ?? false}
                    onChange={() => toggleCheckGroup(group)}
                  />
                  <span className="font-bold">{group.name}</span>
                </div>

                {isOpen && group.cases && group.cases.length > 0 && (
                  <div className="ml-6">
                    {group.cases.map((c) => (
                      <TestItem
                        key={c.id}
                        test={c}
                        checked={checkedTests[c.id] ?? false}
                        onToggle={toggleCheckTest}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      );
    }

    return null;
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <main className="min-h-screen bg-gray-200 p-2">
      <div className="flex gap-2 min-h-screen">
        {/* LEFT PANEL */}
        <div className="flex-[2] bg-white flex flex-col gap-2 p-2 overflow-auto">
          {/* Run selection panel */}
          <div className="bg-green-200 p-2 rounded">
            <h3 className="font-bold mb-1">Start New Test Run</h3>

            {/*----------------------projekty---------------------------------------*/}
            <div>
              <select
                value={activeProjectId ?? ""}
                onChange={(e) => setActiveProjectId(Number(e.target.value))}
              >
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/*----------------------releases---------------------------------------*/}
            <div className="mt-1">
              <select
                value={activeReleaseId ?? ""}
                onChange={(e) => {
                  const releaseId = Number(e.target.value);
                  setActiveReleaseId(releaseId);
                  // if (releaseId && activePlanId) {
                  //   loadRunsForReleaseAndPlan(releaseId, activePlanId);
                  // }
                }}
              >
                <option value="">Select Release</option>
                {releases.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.version}
                  </option>
                ))}
              </select>
            </div>

            {/*----------------------plans---------------------------------------*/}
            <div className="mt-1">
              <select
                value={activePlanId ?? ""}
                onChange={(e) => setActivePlanId(Number(e.target.value))}
              >
                <option value="">Select Plan</option>

                {plans
                  .filter((g) => g.releaseId === activeReleaseId)
                  .flatMap((g) =>
                    g.plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
              </select>
            </div>

            {/* Existing runs dropdown */}
            {/* {runsForTree.length > 0 && (
              <div className="mt-2">
                <select
                  value={activeRunId ?? ""}
                  onChange={(e) => handleSelectRun(Number(e.target.value))}
                >
                  <option value="">Select Active Run</option>
                  {availableRuns.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.status})
                    </option>
                  ))}
                </select>
              </div>
            )} */}

            <button
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600 mt-2"
              onClick={() => startNewRun()}
            >
              Start New Test Run
            </button>
          </div>

          {/* Users / assign to run panel */}
          <div className="bg-green-200 p-2 rounded mt-2">
            <h4 className="font-bold mb-1">Assign User to Run</h4>
            <div className="mt-2">
              <select
                value={selectedRun ?? ""}
                onChange={(e) => setSelectedRun(Number(e.target.value))}
              >
                <option value="">Select Run</option>
                {availableRuns.map((r) => (
                  <option key={r.test_run_id} value={r.test_run_id}>
                    {r.plan_name} ({r.release_version})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedUser ?? ""}
                onChange={(e) => setSelectedUser(Number(e.target.value))}
              >
                <option value="">Select User</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => AddUserToRun()}
              className="mt-2 p-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
            >
              Add user
            </button>
          </div>

          {/*--------------- test runs -------------------*/}
          <div className="bg-green-200 p-2 rounded mt-2">
            <h4 className="font-bold mb-1">Test runs</h4>
            <select
              value={activeRunId ?? ""}
              onChange={(e) => setActiveRunId(Number(e.target.value))}
            >
              <option value="">Select Run</option>
              {availableRunsForUser.map((rt) => (
                <option key={rt.test_run_id} value={rt.test_run_id}>
                  {"ID: " + rt.test_run_id} {rt.plan_name} {rt.release_version}
                </option>
              ))}
            </select>
            <button
              onClick={() => FetchTreeForRun()}
              className="p-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
            >
              Show tests
            </button>
            <div className="text-sm text-gray-600">
              Zalogowany jako: <b>{user?.email}</b> | <b>{user?.name}</b> |{" "}
              <b>ID: {user?.id}</b> | <b>{user?.role}</b>
            </div>
          </div>

          {/* TestTree - only render if run is selected */}
          {activeRunId && (
            <div className="bg-green-200 p-2 rounded flex-1 overflow-auto mt-2">
              <h3 className="font-bold mb-1">Test Tree</h3>
              <TestTree
                nodes={tree}
                forceOpen={false}
                onSelectGroup={(node) => {
                  console.log("Clicked group node:", node);
                  if (node) setSelectedNode({ type: "group", node });
                }}
                onSelectTestCase={(node) => {
                  console.log("Clicked test node:", node);
                  if (node) setSelectedNode({ type: "test", node });
                }}
              />
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-[4] bg-blue-200 flex flex-col p-2 gap-2 overflow-auto">
          <div className="bg-green-300 p-2 rounded flex-1 overflow-auto">
            <h3 className="font-bold mb-2">Assigned Tests & Execution</h3>
            <div className="bg-white p-2 rounded shadow mt-2">
              <h4 className="font-bold mb-2">Selected Node</h4>
              <SelectedNodeViewer selectedNode={selectedNode} />
            </div>
          </div>
        </div>

        {/**/}
      </div>
    </main>
  );
}
