import { useEffect, useState } from "react";
import { fetchFullTree } from "../api/testCases";
import { buildTestTree } from "../utils/buildTestTree";
import { TestTree } from "../components/TestTree/testTree";
import type { TestCaseItem, TestGroupNode } from "../types/testTree";
import GroupEditForm from "../components/GroupEditForm";
import EditTestCaseForm from "../components/TestCaseForm";

export default function TestCasesPage() {
  const [tree, setTree] = useState<TestGroupNode[]>([]);
  const [allOpen, setAllOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TestGroupNode | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCaseItem | null>(null);
  const [showAddRootForm, setShowAddRootForm] = useState(false);

  const token = localStorage.getItem("token");
  const projectId = 1;

  useEffect(() => {
    if (!token) return;

    fetchFullTree(projectId, token)
      .then((rows) => setTree(buildTestTree(rows)))
      .catch((err) => console.error(err));
  }, [token]);

  const toggleAll = () => setAllOpen((prev) => !prev);

  const handleSaveGroup = (updatedGroup: TestGroupNode) => {
    const updateNode = (node: TestGroupNode): TestGroupNode => {
      if (node.id === updatedGroup.id) {
        return { ...node, name: updatedGroup.name, description: updatedGroup.description };
      }
      return { ...node, children: node.children.map(updateNode) };
    };
    setTree((prev) => prev.map(updateNode));
    setSelectedGroup(updatedGroup);
  };

  const addSubgroupToTree = (parentId: number, newGroup: TestGroupNode, nodes: TestGroupNode[]): TestGroupNode[] => {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, newGroup] };
      }
      return { ...node, children: addSubgroupToTree(parentId, newGroup, node.children) };
    });
  };

  const handleDeleteGroup = (groupId: number) => {
    const removeNode = (node: TestGroupNode): TestGroupNode | null => {
      if (node.id === groupId) return null;
      return { ...node, children: node.children.map(removeNode).filter(Boolean) as TestGroupNode[] };
    };
    setTree((prev) => prev.map(removeNode).filter(Boolean) as TestGroupNode[]);
    setSelectedGroup(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-200">
      <aside className="w-70 bg-gray-100 text-black flex flex-col p-4">
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => setShowAddRootForm((prev) => !prev)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mb-4"
          >
            {showAddRootForm ? "Anuluj" : "Dodaj grupę główną"}
          </button>

          <button
            onClick={toggleAll}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 hover:shadow-lg cursor-pointer"
          >
            {allOpen ? "Zwiń wszystko" : "Rozwiń wszystko"}
          </button>

          <div>
            <h1>Przypadki testowe</h1>
            <TestTree
              nodes={tree}
              forceOpen={allOpen}
              onSelectGroup={setSelectedGroup}
              onSelectTestCase={setSelectedTestCase}
            />
          </div>
        </nav>
      </aside>

      <main className="flex-1 px-4 py-2">
        {showAddRootForm && (
          <GroupEditForm
            key="add-root-form"
            mode="add-root"
            onAddRootGroup={(newGroup) => {
              const newNode = { ...newGroup, children: [] };
              setTree((prev) => [...prev, newNode]);
              setSelectedGroup(newNode);
              setShowAddRootForm(false);
            }}
          />
        )}

        {!showAddRootForm && (
          <>
            {selectedGroup && (
              <GroupEditForm
                key={selectedGroup.id}
                group={selectedGroup}
                mode="edit"
                onSave={handleSaveGroup}
                onDelete={handleDeleteGroup}
                onAddSubgroup={(parentId, newGroup) => {
                  const newTree = addSubgroupToTree(
                    parentId,
                    { ...newGroup, children: [] },
                    tree
                  );
                  setTree(newTree);
                  setSelectedGroup({ ...newGroup, children: [] });
                }}
              />
            )}
            {!selectedGroup && selectedTestCase && (
              <EditTestCaseForm
                testCaseId={selectedTestCase.id}
                token={token}
                onSaved={() => alert("Zapisano!")}
              />
            )}
            {!selectedGroup && !selectedTestCase && (
              <div className="text-gray-600">
                Wybierz grupę lub przypadek testowy, aby edytować
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
