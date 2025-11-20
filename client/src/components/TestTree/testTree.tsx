import { useEffect, useState } from "react";
import type { TestCaseItem, TestGroupNode } from "../../types/testTree";
import FolderIcon from "../../assets/folder.png";
import TestCaseIcon from "../../assets/testcase.png";

interface TreeNodeProps1 {
  node: TestGroupNode;
  forceOpen: boolean;
  onSelectGroup: (group: TestGroupNode | null) => void;
  onSelectTestCase: (group: TestCaseItem | null) => void;
}

interface TreeNodeProps2 {
  nodes: TestGroupNode[];
  forceOpen: boolean;
  onSelectGroup: (group: TestGroupNode | null) => void;
  onSelectTestCase: (group: TestCaseItem | null) => void;
}

export function TestTree({ nodes, forceOpen, onSelectGroup, onSelectTestCase }: TreeNodeProps2) {
  const safeNodes = nodes || [];
  return (
    <div>
      {safeNodes.map(node => (
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

function TreeNode({ node, forceOpen, onSelectGroup, onSelectTestCase }: TreeNodeProps1) {
  const [localOpen, setLocalOpen] = useState<boolean | null>(null);
  const children = node.children ?? [];
  const cases = node.cases ?? [];
  const isOpen = localOpen !== null ? localOpen : forceOpen;

  useEffect(() => {
    setLocalOpen(null);
  }, [forceOpen]);

  return (
    <div>
      <div
        onClick={() => {
          setLocalOpen(prev => !prev);
          onSelectGroup(node);
          onSelectTestCase(null);
        }}
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-300 hover:shadow-lg px-1 py-0.5 rounded"
      >
        <img src={FolderIcon} className="w-5 h-5" alt="folder" />
        <span>{node.name}</span>
      </div>

      {isOpen && (
        <div className="ml-4">
          {cases.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-300 hover:shadow-lg px-1 py-0.5 rounded"
              onClick={() => {
                onSelectTestCase(c);
                onSelectGroup(null);
              }}
            >
              <img src={TestCaseIcon} className="w-5 h-5" alt="test case" />
              <span>{c.title}</span>
            </div>
          ))}

          {children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              forceOpen={forceOpen}
              onSelectGroup={onSelectGroup}
              onSelectTestCase={onSelectTestCase}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// import { useEffect, useState } from "react";
// import type { TestCaseItem, TestGroupNode } from "../../types/testTree";
// import FolderIcon from "../../assets/folder.png";
// import TestCaseIcon from "../../assets/testcase.png";


// interface TreeNodeProps1 {
//   node: TestGroupNode;
//   forceOpen: boolean;
//   onSelectGroup: (group: TestGroupNode | null) => void;
//   onSelectTestCase: (group: TestCaseItem | null) => void;
// }
// interface TreeNodeProps2 {
//   nodes: TestGroupNode[];
//   forceOpen: boolean;
//   onSelectGroup: (group: TestGroupNode | null) => void;
//   onSelectTestCase: (group: TestCaseItem | null) => void;
// }

// export function TestTree({ nodes, forceOpen, onSelectGroup, onSelectTestCase }: TreeNodeProps2) {
//   return (
//     <div>
//       {nodes.map(node => (
//         <TreeNode 
//         key={node.id} 
//         node={node} 
//         forceOpen={forceOpen}
//         onSelectGroup={onSelectGroup}
//         onSelectTestCase={onSelectTestCase}/>
//       ))}
//     </div>
//   );
// }

// function TreeNode({ node, forceOpen, onSelectGroup, onSelectTestCase}: TreeNodeProps1) {

//     const [localOpen, setLocalOpen] = useState<boolean | null>(null);
//     const children = node.children || [];
//     const isOpen = localOpen !== null ? localOpen : forceOpen;

//     useEffect(() => {
//         setLocalOpen(null);
//     }, [forceOpen]);

//     return (

//     <div>
//         <div onClick={ () => {
//           setLocalOpen(prev => !prev); 
//           onSelectGroup(node);
//           onSelectTestCase(null);
//           }
//         } 
//           className="flex items-center gap-2 cursor-pointer hover:bg-gray-300 hover:shadow-lg">
//             <img src={FolderIcon} className="w-5 h-5" />
//             <span>{node.name}</span>
//         </div>

//         {isOpen && (
//         <div className="ml-4">
            
//             {node.cases.map(c => (
//             <div 
//             key={c.id} 
//             className="flex items-center gap-2 cursor-pointer hover:bg-gray-300 hover:shadow-lg"
//             onClick={() => 
//             { 
//               onSelectTestCase(c); 
//               onSelectGroup(null); }
//             }>
//                 <img src={TestCaseIcon} className="w-5 h-5" /> 
//                 <span>{c.title}</span>
//             </div>
//             ))}
            
//             {children.map(child => (
//             <TreeNode key={child.id} node={child} forceOpen={forceOpen} onSelectGroup={onSelectGroup} onSelectTestCase={onSelectTestCase}/>
//             ))}

//         </div>
//         )}
//     </div>
//     );
// }