import { useEffect, useState } from "react";
import { fetchFullTree } from "../api/testCases";
import { buildTestTree } from "../utils/buildTestTree";
import { TestTree } from "../components/TestTree/testTree";
import type { TestCaseItem, TestGroupNode } from "../types/testTree";
import GroupEditForm from "../components/GroupEditForm";

function updateNode(node: TestGroupNode, updatedGroup: TestGroupNode): TestGroupNode {
  if (node.id === updatedGroup.id) {
    return { ...node, name: updatedGroup.name, description: updatedGroup.description };
  }
  return {
    ...node,
    children: node.children.map(child => updateNode(child, updatedGroup)),
  };
}

export default function TestCasesPage() {
  const [tree, setTree] = useState<any[]>([]);
  const [allOpen, setAllOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TestGroupNode | null>(null);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCaseItem | null>(null);
  const token = localStorage.getItem("token");
  const projectId = 1;

  const toggleAll = () => setAllOpen(prev => !prev);

  useEffect(() => {
    if (!token) return;

    fetchFullTree(projectId, token)
      .then(rows => setTree(buildTestTree(rows)))
      .catch(err => console.error(err));
  }, []);

  function handleSave(updatedGroup: TestGroupNode) {
    const newTree = tree.map(node => updateNode(node, updatedGroup));
    setTree(newTree);
    setSelectedGroup(updatedGroup);
  }

  function addSubgroupToTree(parentId: number, newGroup: TestGroupNode, nodes: TestGroupNode[]): TestGroupNode[] {
  return nodes.map(node => {
    if (node.id === parentId) {
      return { ...node, children: [...node.children, newGroup] };
    }
    return { ...node, children: addSubgroupToTree(parentId, newGroup, node.children) };
  });
}

  // function handleDelete(groupId: number) {
  //   const removeNode = (node: TestGroupNode): TestGroupNode | null => {
  //     if (node.id === groupId) return null;
  //     return {
  //       ...node,
  //       children: node.children
  //         .map(removeNode)
  //         .filter(Boolean) as TestGroupNode[],
  //     };
  //   };

  //   setTree(tree.map(removeNode).filter(Boolean) as TestGroupNode[]);
  //   setSelectedGroup(null);
  // }


  return (
    <div className="flex min-h-screen bg-gray-200">
            <aside className="w-70 bg-gray-100 text-black flex flex-col p-4">
                <nav className="flex flex-col gap-2">
                  <button onClick={toggleAll} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 hover:shadow-lg cursor-pointer">
                    {allOpen ? "Zwiń wszystko" : "Rozwiń wszystko"}
                  </button>
                  <div>
                    <h1>Przypadki testowe</h1>
                    <TestTree nodes={tree} forceOpen={allOpen} onSelectGroup={setSelectedGroup} onSelectTestCase={setSelectedTestCase}/>
                  </div>
                </nav>
            </aside>
            <main className="flex-1">
              {(() => {
                if (selectedGroup) 
                  return <div className="bg-gray-300 px-4 py-2"> <GroupEditForm group={selectedGroup} onAddSubgroup={(parentId, newGroup) => {
                  const newTree = addSubgroupToTree(parentId, newGroup, tree);
                  setTree(newTree);
                }} onSave={handleSave} 
                  onDelete={(groupId) => {
                    const removeNode = (node: TestGroupNode): TestGroupNode | null => {
                      if (node.id === groupId) return null;
                      return {
                        ...node,
                        children: node.children.map(removeNode).filter(Boolean) as TestGroupNode[],
                      };
                    };
                    setTree(tree.map(removeNode).filter(Boolean) as TestGroupNode[]);
                    setSelectedGroup(null);
                  }}/> </div>;
                if (selectedTestCase) 
                  return <div className="px-4 py-2 bg-white rounded shadow-md"> <h2 className="text-xl font-bold">Edytuj test case: {selectedTestCase.title}</h2> </div>
                if (!selectedGroup && !selectedTestCase) return <div className="text-gray-600">Wybierz grupę lub przypadek testowy, aby edytować</div>;
              })() }
              <div className="bg-gray-200 px-4 py-2 hover:bg-yellow-200 hover:shadow-lg cursor-pointer transition-all duration-300">

              </div>
            </main>
        </div>
  );
}