import { useEffect, useState } from "react";
import { fetchFullTree } from "../api/testCases";
import { buildTestTree } from "../utils/buildTestTree";
import { TestTree } from "../components/TestTree/testTree";
import type { TestCaseItem, TestGroupNode } from "../types/testTree";
import GroupEditForm from "../components/GroupEditForm";
import EditTestCaseForm from "../components/TestCaseForm";
import { useApi } from "../hooks/apiFetch";

export default function TestCasesPage() {
  const [tree, setTree] = useState<TestGroupNode[]>([]);
  const [allOpen, setAllOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TestGroupNode | null>(
    null,
  );
  const [selectedTestCase, setSelectedTestCase] = useState<TestCaseItem | null>(
    null,
  );
  const [addingTestToGroup, setAddingTestToGroup] =
    useState<TestGroupNode | null>(null);
  const [showAddRootForm, setShowAddRootForm] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");
  const [projectId, setProjectId] = useState<number>(1);

  const { apiFetch } = useApi();

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
  // ----------------------------
  // Fetch full tree on mount
  // ----------------------------
  useEffect(() => {
    if (!token) return;
    fetchFullTree(projectId, token)
      .then((rows) => setTree(buildTestTree(rows)))
      .catch(console.error);
  }, [token, projectId]);

  // ----------------------------
  // Toggle expand/collapse all
  // ----------------------------
  const toggleAll = () => setAllOpen((prev) => !prev);

  // ----------------------------
  // Group operations
  // ----------------------------
  const handleSaveGroup = (updatedGroup: TestGroupNode) => {
    const updateNode = (node: TestGroupNode): TestGroupNode => {
      if (node.id === updatedGroup.id)
        return {
          ...node,
          name: updatedGroup.name,
          description: updatedGroup.description,
        };
      return { ...node, children: node.children.map(updateNode) };
    };
    setTree((prev) => prev.map(updateNode));
    setSelectedGroup(updatedGroup);
  };

  const addSubgroupToTree = (
    parentId: number,
    newGroup: TestGroupNode,
    nodes: TestGroupNode[],
  ): TestGroupNode[] => {
    return nodes.map((node) =>
      node.id === parentId
        ? { ...node, children: [...node.children, newGroup] }
        : {
            ...node,
            children: addSubgroupToTree(parentId, newGroup, node.children),
          },
    );
  };

  const handleDeleteGroup = (groupId: number) => {
    const removeNode = (node: TestGroupNode): TestGroupNode | null => {
      if (node.id === groupId) return null;
      return {
        ...node,
        children: node.children
          .map(removeNode)
          .filter(Boolean) as TestGroupNode[],
      };
    };
    setTree((prev) => prev.map(removeNode).filter(Boolean) as TestGroupNode[]);
    setSelectedGroup(null);
  };

  // ----------------------------
  // Test case operations
  // ----------------------------
  const handleAddTestToTree = (groupId: number, newTest: TestCaseItem) => {
    const addTestNode = (node: TestGroupNode): TestGroupNode => {
      if (node.id === groupId)
        return { ...node, cases: [...node.cases, newTest] };
      return { ...node, children: node.children.map(addTestNode) };
    };
    setTree((prev) => prev.map(addTestNode));
  };

  const removeTestFromTree = (
    nodes: TestGroupNode[],
    testId: number,
  ): TestGroupNode[] => {
    return nodes.map((node) => ({
      ...node,
      cases: node.cases.filter((c) => c.id !== testId),
      children: removeTestFromTree(node.children, testId),
    }));
  };

  // ----------------------------
  // Render
  // ----------------------------
  // return (
  //   <div className="flex min-h-screen bg-gray-200">
  //     {/* Sidebar */}
  //     <aside className="w-70 bg-gray-100 text-black flex flex-col p-4">
  //       <button
  //         onClick={() => setShowAddRootForm((prev) => !prev)}
  //         className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
  //       >
  //         {showAddRootForm ? "Anuluj" : "Dodaj grupę główną"}
  //       </button>
  //       <button
  //         onClick={toggleAll}
  //         className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
  //       >
  //         {allOpen ? "Zwiń wszystko" : "Rozwiń wszystko"}
  //       </button>

  //       <h1>Przypadki testowe</h1>
  //       <TestTree
  //         nodes={tree}
  //         forceOpen={allOpen}
  //         onSelectGroup={setSelectedGroup}
  //         onSelectTestCase={setSelectedTestCase}
  //       />
  //     </aside>

  //     {/* Main panel */}
  //     <main className="flex-1 px-4 py-2">
  //       {showAddRootForm && (
  //         <GroupEditForm
  //           key="add-root-form"
  //           mode="add-root"
  //           onAddRootGroup={(newGroup) => {
  //             setTree((prev) => [
  //               ...prev,
  //               { ...newGroup, children: [], cases: [] },
  //             ]);
  //             setSelectedGroup({ ...newGroup, children: [], cases: [] });
  //             setShowAddRootForm(false);
  //           }}
  //         />
  //       )}

  //       {!showAddRootForm && (
  //         <>
  //           {selectedGroup && !addingTestToGroup && (
  //             <GroupEditForm
  //               key={selectedGroup.id}
  //               group={selectedGroup}
  //               mode="edit"
  //               onSave={handleSaveGroup}
  //               onDelete={handleDeleteGroup}
  //               onAddSubgroup={(parentId, newGroup) =>
  //                 setTree(
  //                   addSubgroupToTree(
  //                     parentId,
  //                     { ...newGroup, children: [], cases: [] },
  //                     tree
  //                   )
  //                 )
  //               }
  //               onAddTest={(group) => setAddingTestToGroup(group)}
  //             />
  //           )}

  //           {addingTestToGroup && (
  //             <EditTestCaseForm
  //               key={addingTestToGroup.id}
  //               testCaseId={null}
  //               token={token}
  //               groupId={addingTestToGroup.id}
  //               onSaved={(newTest) => {
  //                 handleAddTestToTree(addingTestToGroup.id, newTest);
  //                 setAddingTestToGroup(null);
  //               }}
  //             />
  //           )}

  //           {selectedTestCase && !selectedGroup && !addingTestToGroup && (
  //             <EditTestCaseForm
  //               testCaseId={selectedTestCase.id}
  //               token={token}
  //               groupId={selectedTestCase.id}
  //               onSaved={() => alert("Zapisano!")}
  //               onDeleted={() => {
  //                 setTree((prev) =>
  //                   removeTestFromTree(prev, selectedTestCase.id)
  //                 );
  //                 setSelectedTestCase(null);
  //               }}
  //             />
  //           )}

  //           {!selectedGroup && !selectedTestCase && !addingTestToGroup && (
  //             <div className="text-gray-600">
  //               Wybierz grupę lub przypadek testowy, aby edytować
  //             </div>
  //           )}
  //         </>
  //       )}
  //     </main>
  //   </div>
  // );

  return (
    <div className="flex min-h-screen bg-gray-200">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-80 bg-white border-r border-gray-300 p-6 flex flex-col">
        <h2 className="text-lg font-bold text-gray-800 mb-6">
          Test Cases Library
        </h2>

        <div className="flex flex-col gap-3 mb-6">
          <select
            value={activeProjectId ?? ""}
            onChange={(e) => setProjectId(Number(e.target.value))}
            className="flex min-w-48 border border-gray-300 px-3 py-2 rounded-md text-sm mb-2 bg-white focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowAddRootForm((prev) => !prev)}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition"
          >
            {showAddRootForm ? "Cancel" : "Add main group"}
          </button>

          <button
            onClick={toggleAll}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <div className="flex-1 overflow-auto pt-4">
          <TestTree
            nodes={tree}
            forceOpen={allOpen}
            onSelectGroup={setSelectedGroup}
            onSelectTestCase={setSelectedTestCase}
          />
        </div>
      </aside>

      {/* ===== MAIN PANEL ===== */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6 min-h-[400px]">
          {showAddRootForm && (
            <GroupEditForm
              key="add-root-form"
              mode="add-root"
              onAddRootGroup={(newGroup) => {
                setTree((prev) => [
                  ...prev,
                  { ...newGroup, children: [], cases: [] },
                ]);
                setSelectedGroup({ ...newGroup, children: [], cases: [] });
                setShowAddRootForm(false);
              }}
            />
          )}

          {!showAddRootForm && (
            <>
              {selectedGroup && !addingTestToGroup && (
                <GroupEditForm
                  key={selectedGroup.id}
                  group={selectedGroup}
                  mode="edit"
                  onSave={handleSaveGroup}
                  onDelete={handleDeleteGroup}
                  onAddSubgroup={(parentId, newGroup) =>
                    setTree(
                      addSubgroupToTree(
                        parentId,
                        { ...newGroup, children: [], cases: [] },
                        tree,
                      ),
                    )
                  }
                  onAddTest={(group) => setAddingTestToGroup(group)}
                />
              )}

              {addingTestToGroup && (
                <EditTestCaseForm
                  key={addingTestToGroup.id}
                  testCaseId={null}
                  token={token}
                  groupId={addingTestToGroup.id}
                  onSaved={(newTest) => {
                    handleAddTestToTree(addingTestToGroup.id, newTest);
                    setAddingTestToGroup(null);
                  }}
                />
              )}

              {selectedTestCase && !selectedGroup && !addingTestToGroup && (
                <EditTestCaseForm
                  testCaseId={selectedTestCase.id}
                  token={token}
                  groupId={selectedTestCase.id}
                  onSaved={() => alert("Zapisano!")}
                  onDeleted={() => {
                    setTree((prev) =>
                      removeTestFromTree(prev, selectedTestCase.id),
                    );
                    setSelectedTestCase(null);
                  }}
                />
              )}

              {!selectedGroup && !selectedTestCase && !addingTestToGroup && (
                <div className="text-gray-500 text-sm text-center py-20">
                  Wybierz grupę lub przypadek testowy, aby edytować
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
