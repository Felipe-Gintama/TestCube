import { useState, useEffect } from "react";
import type { TestCaseItem, TestGroupNode } from "../../types/testTree";
import FolderIcon from "../../assets/folder.png";
import TestCaseIcon from "../../assets/testcase.png";

interface TestTreeProps {
  nodes: TestGroupNode[];
  forceOpen: boolean;
  onSelectGroup: (group: TestGroupNode | null) => void;
  onSelectTestCase: (test: TestCaseItem | null) => void;
}

interface TreeNodeProps {
  node: TestGroupNode;
  forceOpen: boolean;
  onSelectGroup: (group: TestGroupNode | null) => void;
  onSelectTestCase: (test: TestCaseItem | null) => void;
}

// =====================
// Kontener drzewa
// =====================
export function TestTree({
  nodes,
  forceOpen,
  onSelectGroup,
  onSelectTestCase,
}: TestTreeProps) {
  if (!nodes || nodes.length === 0) return <div>Brak grup testowych</div>;

  return (
    <div>
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          forceOpen={forceOpen}
          onSelectGroup={onSelectGroup}
          onSelectTestCase={onSelectTestCase}
        />
      ))}
    </div>
  );
}

// =====================
// Pojedynczy węzeł (rekurencyjny)
// =====================
function TreeNode({
  node,
  forceOpen,
  onSelectGroup,
  onSelectTestCase,
}: TreeNodeProps) {
  const [localOpen, setLocalOpen] = useState<boolean | null>(null);

  const isOpen = localOpen !== null ? localOpen : forceOpen;
  const children = node.children ?? [];
  const cases = node.cases ?? [];

  useEffect(() => {
    setLocalOpen(null); // reset lokalnego otwarcia przy zmianie forceOpen
  }, [forceOpen]);

  const toggleOpen = () => {
    setLocalOpen((prev) => !prev);
    onSelectGroup(node);
    onSelectTestCase(null);
  };

  const handleSelectCase = (testCase: TestCaseItem) => {
    onSelectTestCase(testCase);
    onSelectGroup(null);
  };

  return (
    // <div>
    //   {/* Węzeł grupy */}
    //   <div
    //     onClick={toggleOpen}
    //     className="flex items-center gap-2 cursor-pointer hover:bg-gray-300 hover:shadow-lg px-1 py-0.5 rounded"
    //   >
    //     <img src={FolderIcon} alt="folder" className="w-5 h-5" />
    //     <span>{node.name}</span>
    //   </div>

    //   {/* Dzieci i przypadki testowe */}
    //   {isOpen && (
    //     <div className="ml-4">
    //       {cases.map((c) => (
    //         <div
    //           key={c.id}
    //           onClick={() => handleSelectCase(c)}
    //           className="flex items-center gap-2 cursor-pointer hover:bg-gray-300 hover:shadow-lg px-1 py-0.5 rounded"
    //         >
    //           <img src={TestCaseIcon} alt="test case" className="w-5 h-5" />
    //           <span>{c.title}</span>
    //         </div>
    //       ))}

    //       {children.map((child) => (
    //         <TreeNode
    //           key={child.id}
    //           node={child}
    //           forceOpen={forceOpen}
    //           onSelectGroup={onSelectGroup}
    //           onSelectTestCase={onSelectTestCase}
    //         />
    //       ))}
    //     </div>
    //   )}
    // </div>
    <div>
      <div className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-gray-200">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLocalOpen((prev) => !prev);
          }}
          className="w-4 h-4 flex items-center justify-center"
        >
          <svg
            className={`w-3 h-3 transition-transform duration-300 ease-in-out ${
              isOpen ? "rotate-90" : "rotate-0"
            }`}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="m12.14 8.753-5.482 4.796c-.646.566-1.658.106-1.658-.753V3.204a1 1 0 0 1 1.659-.753l5.48 4.796a1 1 0 0 1 0 1.506z" />
          </svg>
        </button>

        <img src={FolderIcon} alt="folder" className="w-5 h-5" />
        <span
          onClick={() => {
            onSelectGroup(node);
            onSelectTestCase(null);
          }}
          className="cursor-pointer"
        >
          {node.name}
        </span>
      </div>
      <div
        className={`ml-6 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-1 space-y-1">
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => handleSelectCase(c)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-200 px-2 py-1 rounded transition-colors duration-150"
            >
              <img src={TestCaseIcon} alt="test case" className="w-5 h-5" />
              <span>{c.title}</span>
            </div>
          ))}

          {children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              forceOpen={forceOpen}
              onSelectGroup={onSelectGroup}
              onSelectTestCase={onSelectTestCase}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
