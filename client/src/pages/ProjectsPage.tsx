import { useState, useEffect } from "react";
import { useApi } from "../hooks/apiFetch";
import type { Project } from "../api/projects";
import { useGithubApi } from "../hooks/useGithubApi";
import {
  Home,
  Settings,
  User,
  Edit,
  Minus,
  Plus,
  UserMinus,
  UserRoundMinus,
} from "lucide-react";

type User = { id: number; name: string };

// function useProjectsApi() {
//   const { apiFetch } = useApi();

//   return {
//     fetchProjects: () => apiFetch("http://localhost:4000/api/projects"),
//     createProject: (name: string, desc: string, githubRepo: string | null) =>
//       apiFetch("http://localhost:4000/api/projects", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name, desc, repo: githubRepo }),
//       }),

//     addMember: (projectId: number, userId: number) =>
//       apiFetch(
//         `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ userId }),
//         },
//       ),
//     removeMember: (projectId: number, userId: number) =>
//       apiFetch(
//         `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ userId }),
//         },
//       ),
//     fetchUsers: () => apiFetch("http://localhost:4000/api/users"),

//     updateGithubRepo: (projectId: number, githubRepo: string) =>
//       apiFetch(`http://localhost:4000/api/projects/${projectId}/github-repo`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ repo: githubRepo }),
//       }),

//     deleteProject: (projectId: number) =>
//       apiFetch(`http://localhost:4000/api/projects/${projectId}`, {
//         method: "DELETE",
//       }),

//     updateProject: (projectId: number, desc: string, githubRepo: string) =>
//       apiFetch(`http://localhost:4000/api/projects/${projectId}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ desc, github_repo: githubRepo }),
//       }),
//   };
// }

// export default function ProjectsPage() {
//   const api = useProjectsApi();
//   const { createIssue } = useGithubApi();

//   // --- New Project ---
//   const [name, setName] = useState("");
//   const [desc, setDesc] = useState("");
//   const [githubRepo, setGithubRepo] = useState("");
//   const [projectMessage, setProjectMessage] = useState<string | null>(null);

//   // --- Add Member ---
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   //const [selectedProject, setSelectedProject] = useState<number | "">("");
//   const [selectedUser, setSelectedUser] = useState<number | "">("");
//   const [memberMessage, setMemberMessage] = useState<string | null>(null);

//   // --- Create GitHub Issue ---
//   const [issueProjectId, setIssueProjectId] = useState<number | "">("");
//   const [issueTitle, setIssueTitle] = useState("");
//   const [issueBody, setIssueBody] = useState("");
//   const [issueMessage, setIssueMessage] = useState<string | null>(null);

//   // --- Assign GitHub Repo ---
//   const [repoProjectId, setRepoProjectId] = useState<number | "">("");
//   const [repoValue, setRepoValue] = useState("");
//   const [repoMessage, setRepoMessage] = useState<string | null>(null);

//   const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
//   const [editDesc, setEditDesc] = useState("");
//   const [editRepo, setEditRepo] = useState("");

//   const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
//     null,
//   );

//   const selectedProject = projects.find((p) => p.id === selectedProjectId);

//   useEffect(() => {
//     if (selectedProject) {
//       setEditDesc(selectedProject.description || "");
//       setEditRepo(selectedProject.github_repo || "");
//     }
//   }, [selectedProjectId]);

//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const [projectsData, usersData] = await Promise.all([
//           api.fetchProjects(),
//           api.fetchUsers(),
//         ]);
//         setProjects(projectsData);
//         setUsers(usersData);
//       } catch (err) {
//         console.error(err);
//       }
//     }
//     fetchData();
//   }, []);

//   // async function handleCreateProject(e: React.FormEvent) {
//   //   e.preventDefault();
//   //   setProjectMessage(null);

//   //   if (!name) return setProjectMessage("Project name is required");

//   //   try {
//   //     const project = await api.createProject(name, desc, githubRepo);
//   //     console.log("repo: ", githubRepo);
//   //     setProjectMessage(
//   //       `Project created: ${project.name} ${project.githubRepo} ${project.desc}`,
//   //     );
//   //     setName("");
//   //     setDesc("");
//   //     setGithubRepo("");
//   //     setProjects((prev) => [...prev, project]); // dodaj nowy projekt do listy
//   //   } catch (err: any) {
//   //     setProjectMessage(err?.message || "Failed to create project");
//   //   }
//   // }

//   // async function handleAddMember(e: React.FormEvent) {
//   //   e.preventDefault();
//   //   setMemberMessage(null);

//   //   if (!selectedProject || !selectedUser) {
//   //     return setMemberMessage("Select a project and a user");
//   //   }

//   //   try {
//   //     await api.addMember(selectedProject, selectedUser);
//   //     setMemberMessage("User added to project!");
//   //     setSelectedProject("");
//   //     setSelectedUser("");
//   //   } catch (err: any) {
//   //     setMemberMessage(err?.message || "Failed to add member");
//   //   }
//   // }

//   // async function handleCreateIssue(e: React.FormEvent) {
//   //   e.preventDefault();
//   //   setIssueMessage(null);

//   //   if (!issueProjectId || !issueTitle) {
//   //     return setIssueMessage("Select project and issue title");
//   //   }

//   //   const project = projects.find((p) => p.id === issueProjectId);

//   //   if (!project || !project.github_repo) {
//   //     return setIssueMessage("Selected project has no GitHub repo");
//   //   }

//   //   try {
//   //     await createIssue(project.github_repo, issueTitle, issueBody);
//   //     setIssueMessage(
//   //       `Issue "${issueTitle}" created in ${project.github_repo}`,
//   //     );
//   //     setIssueTitle("");
//   //     setIssueBody("");
//   //     setIssueProjectId("");
//   //   } catch (err) {
//   //     console.error(err);
//   //     setIssueMessage("Failed to create issue");
//   //   }
//   // }

//   // async function handleAssignRepo(e: React.FormEvent) {
//   //   e.preventDefault();
//   //   setRepoMessage(null);

//   //   if (!repoProjectId || !repoValue) {
//   //     return setRepoMessage("Select project and enter repo");
//   //   }

//   //   try {
//   //     const updated = await api.updateGithubRepo(repoProjectId, repoValue);

//   //     setProjects((prev) =>
//   //       prev.map((p) =>
//   //         p.id === updated.id ? { ...p, github_repo: updated.github_repo } : p,
//   //       ),
//   //     );

//   //     setRepoMessage("GitHub repo assigned to project");
//   //     setRepoProjectId("");
//   //     setRepoValue("");
//   //   } catch (err: any) {
//   //     setRepoMessage(err?.message || "Failed to assign repo");
//   //   }
//   // }

//   return (
//     <main className="p-4 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold mb-6">Projects Management</h1>

//       {/* <div className="m-2 bg-white rounded shadow overflow-hidden w-[80%]">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-2 text-left">Name</th>
//               <th className="p-2 text-left">Description</th>
//               <th className="p-2 text-left">GitHub Repo</th>
//               <th className="p-2 text-left">Created At</th>
//               <th className="p-2 text-center">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {projects.map((p) => {
//               const isEditing = p.id === editingProjectId; // state sprawdzający, który projekt edytujemy
//               return (
//                 <tr key={p.id} className="border-t">
//                   <td className="p-2">{p.name}</td>

//                   <td className="p-2 text-left">
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={editDesc}
//                         className="border rounded px-2 py-1 w-full"
//                         onChange={(e) => setEditDesc(e.target.value)}
//                       />
//                     ) : (
//                       p.description
//                     )}
//                   </td>

//                   <td className="p-2 text-left">
//                     {isEditing ? (
//                       <input
//                         type="text"
//                         value={editRepo}
//                         className="border rounded px-2 py-1 w-full"
//                         onChange={(e) => setEditRepo(e.target.value)}
//                       />
//                     ) : (
//                       p.github_repo || "-"
//                     )}
//                   </td>

//                   <td className="p-2">{p.created_at}</td>

//                   <td className="p-2 text-center flex justify-center gap-2">
//                     {isEditing ? (
//                       <button
//                         className="text-green-600 hover:underline"
//                         onClick={async () => {
//                           try {
//                             const updated = await api.updateProject(
//                               p.id,
//                               editDesc,
//                               editRepo,
//                             );

//                             setProjects((prev) =>
//                               prev.map((proj) =>
//                                 proj.id === updated.id ? updated : proj,
//                               ),
//                             );

//                             setEditingProjectId(null);
//                           } catch (err: any) {
//                             alert(err?.message || "Failed to save project");
//                           }
//                         }}
//                       >
//                         Save
//                       </button>
//                     ) : (
//                       <button
//                         className="text-blue-600 hover:underline"
//                         onClick={() => {
//                           setEditingProjectId(p.id);
//                           setEditDesc(p.description || "");
//                           setEditRepo(p.github_repo || "");
//                         }}
//                       >
//                         Edit
//                       </button>
//                     )}

//                     <button
//                       className="text-red-600 hover:underline"
//                       onClick={async () => {
//                         if (!confirm("Delete project?")) return;
//                         try {
//                           await api.deleteProject(p.id);
//                           setProjects((prev) =>
//                             prev.filter((proj) => proj.id !== p.id),
//                           );
//                         } catch (err: any) {
//                           alert(err?.message || "Failed to delete project");
//                         }
//                       }}
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div> */}

//       {/* --- New Project --- */}
//       {/* <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md mb-8">
//         <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
//         <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
//           <input
//             type="text"
//             placeholder="Project Name"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             className="border p-2 rounded-md"
//           />
//           <input
//             type="text"
//             placeholder="Project Description"
//             value={desc}
//             onChange={(e) => setDesc(e.target.value)}
//             className="border p-2 rounded-md"
//           />
//           <input
//             type="text"
//             placeholder="GitHub Repo (owner/repo)"
//             value={githubRepo}
//             onChange={(e) => setGithubRepo(e.target.value)}
//             className="border p-2 rounded-md"
//           />
//           <button
//             type="submit"
//             className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
//           >
//             Create Project
//           </button>
//         </form>
//         {projectMessage && (
//           <p className="mt-2 text-gray-700">{projectMessage}</p>
//         )}
//       </div> */}

//       {/* --- Add Member --- */}
//       {/* <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
//         <h2 className="text-xl font-semibold mb-4">Add Member to Project</h2>
//         <form onSubmit={handleAddMember} className="flex flex-col gap-4">
//           <select
//             value={selectedProject}
//             onChange={(e) => setSelectedProject(Number(e.target.value))}
//             className="border p-2 rounded-md"
//           >
//             <option value="">Select Project</option>
//             {projects.map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.name}
//               </option>
//             ))}
//           </select>

//           <select
//             value={selectedUser}
//             onChange={(e) => setSelectedUser(Number(e.target.value))}
//             className="border p-2 rounded-md"
//           >
//             <option value="">Select User</option>
//             {users.map((u) => (
//               <option key={u.id} value={u.id}>
//                 {u.name}
//               </option>
//             ))}
//           </select>

//           <button
//             type="submit"
//             className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
//           >
//             Add Member
//           </button>
//         </form>
//         {memberMessage && <p className="mt-2 text-gray-700">{memberMessage}</p>}
//       </div> */}

//       {/* --- Create GitHub Issue --- */}
//       {/* <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md mt-8">
//         <h2 className="text-xl font-semibold mb-4">Create GitHub Issue</h2>

//         <form onSubmit={handleCreateIssue} className="flex flex-col gap-4">
//           <select
//             value={issueProjectId}
//             onChange={(e) => setIssueProjectId(Number(e.target.value))}
//             className="border p-2 rounded-md"
//           >
//             <option value="">Select project</option>
//             {projects.map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.name} ({p.github_repo || "no repo"})
//               </option>
//             ))}
//           </select>

//           <input
//             type="text"
//             placeholder="Issue title"
//             value={issueTitle}
//             onChange={(e) => setIssueTitle(e.target.value)}
//             className="border p-2 rounded-md"
//           />

//           <textarea
//             placeholder="Issue description (optional)"
//             value={issueBody}
//             onChange={(e) => setIssueBody(e.target.value)}
//             className="border p-2 rounded-md"
//           />

//           <button
//             type="submit"
//             className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
//           >
//             Create Issue
//           </button>
//         </form>

//         {issueMessage && <p className="mt-2 text-gray-700">{issueMessage}</p>}
//       </div> */}

//       {/* --- Assign GitHub Repo --- */}
//       {/* <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md mt-8">
//         <h2 className="text-xl font-semibold mb-4">
//           Assign GitHub Repo to Project
//         </h2>

//         <form onSubmit={handleAssignRepo} className="flex flex-col gap-4">
//           <select
//             value={repoProjectId}
//             onChange={(e) => setRepoProjectId(Number(e.target.value))}
//             className="border p-2 rounded-md"
//           >
//             <option value="">Select project</option>
//             {projects.map((p) => (
//               <option key={p.id} value={p.id}>
//                 {p.name} ({p.github_repo || "no repo"})
//               </option>
//             ))}
//           </select>

//           <input
//             type="text"
//             placeholder="GitHub repo (owner/repo)"
//             value={repoValue}
//             onChange={(e) => setRepoValue(e.target.value)}
//             className="border p-2 rounded-md"
//           />

//           <button
//             type="submit"
//             className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md"
//           >
//             Save Repo
//           </button>
//         </form>

//         {repoMessage && <p className="mt-2 text-gray-700">{repoMessage}</p>}
//       </div> */}

//       <div className="m-2 bg-white rounded shadow overflow-hidden w-[80%]">
//         <table className="w-full text-sm">
//           <thead className="bg-gray-200">
//             <tr>
//               <th className="p-2 text-left">Name</th>
//               <th className="p-2 text-left">Description</th>
//               <th className="p-2 text-left">GitHub Repo</th>
//               <th className="p-2 text-left">Created At</th>
//             </tr>
//           </thead>

//           <tbody>
//             {projects.map((p) => (
//               <tr
//                 key={p.id}
//                 className={`border-t cursor-pointer hover:bg-gray-100 ${
//                   selectedProjectId === p.id ? "bg-blue-50" : ""
//                 }`}
//                 onClick={() => setSelectedProjectId(p.id)}
//               >
//                 <td className="p-2">{p.name}</td>
//                 <td className="p-2">{p.description}</td>
//                 <td className="p-2">{p.github_repo || "-"}</td>
//                 <td className="p-2">{p.created_at}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {selectedProject && (
//         <div className="m-2 bg-white rounded shadow p-6 w-[80%]">
//           <h2 className="text-xl font-semibold mb-4">
//             Edit Project: {selectedProject.name}
//           </h2>

//           {/* Description */}
//           <label className="block mb-2 text-sm font-medium">Description</label>
//           <input
//             type="text"
//             value={editDesc}
//             onChange={(e) => setEditDesc(e.target.value)}
//             className="border rounded px-2 py-1 w-full mb-4"
//           />

//           {/* GitHub Repo */}
//           <label className="block mb-2 text-sm font-medium">GitHub Repo</label>
//           <input
//             type="text"
//             value={editRepo}
//             onChange={(e) => setEditRepo(e.target.value)}
//             placeholder="owner/repo"
//             className="border rounded px-2 py-1 w-full mb-4"
//           />

//           <button
//             className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
//             onClick={async () => {
//               try {
//                 const updated = await api.updateProject(
//                   selectedProject.id,
//                   editDesc,
//                   editRepo,
//                 );

//                 setProjects((prev) =>
//                   prev.map((p) => (p.id === updated.id ? updated : p)),
//                 );
//               } catch (err: any) {
//                 alert(err?.message || "Failed to update project");
//               }
//             }}
//           >
//             Save Changes
//           </button>

//           {/* --- USERS MANAGEMENT --- */}
//           <div className="mt-8">
//             <h3 className="text-lg font-semibold mb-2">Project Members</h3>

//             <ul className="mb-4">
//               {selectedProject.users?.map((u: any) => (
//                 <li key={u.id} className="flex justify-between mb-1">
//                   {u.name}
//                   <button
//                     className="text-red-600 hover:underline"
//                     onClick={() => api.removeMember(selectedProject.id, u.id)}
//                   >
//                     Remove
//                   </button>
//                 </li>
//               ))}
//             </ul>

//             <select
//               onChange={(e) =>
//                 api.addMember(selectedProject.id, Number(e.target.value))
//               }
//               className="border p-2 rounded"
//             >
//               <option value="">Add user</option>
//               {users.map((u) => (
//                 <option key={u.id} value={u.id}>
//                   {u.name}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* --- DELETE PROJECT --- */}
//           <div className="mt-8 border-t pt-4">
//             <button
//               className="text-red-600 hover:underline"
//               onClick={async () => {
//                 if (!confirm("Delete this project?")) return;
//                 try {
//                   await api.deleteProject(selectedProject.id);
//                   setProjects((prev) =>
//                     prev.filter((p) => p.id !== selectedProject.id),
//                   );
//                   setSelectedProjectId(null);
//                 } catch {
//                   alert("Failed to delete project");
//                 }
//               }}
//             >
//               Delete Project
//             </button>
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }

// function useProjectsApi() {
//   const { apiFetch } = useApi();

//   return {
//     fetchProjects: () => apiFetch("http://localhost:4000/api/projects"),
//     fetchUsers: () => apiFetch("http://localhost:4000/api/users"),
//     fetchUsersFromProject: (projectId: number) =>
//       apiFetch(`http://localhost:4000/api/projects/${projectId}`),

//     updateProject: (
//       projectId: number,
//       description: string,
//       githubRepo: string,
//     ) =>
//       apiFetch(`http://localhost:4000/api/projects/${projectId}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           description,
//           github_repo: githubRepo || null,
//         }),
//       }),

//     deleteProject: (projectId: number) =>
//       apiFetch(`http://localhost:4000/api/projects/${projectId}`, {
//         method: "DELETE",
//       }),

//     addMember: (projectId: number, userId: number) =>
//       apiFetch(
//         `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
//         { method: "POST" },
//       ),

//     removeMember: (projectId: number, userId: number) =>
//       apiFetch(
//         `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
//         { method: "DELETE" },
//       ),
//   };
// }

// export default function ProjectsPage() {
//   const api = useProjectsApi();

//   const [projects, setProjects] = useState<Project[]>([]);
//   const [users, setUsers] = useState<User[]>([]);
//   const [projectUsers, setProjectUsers] = useState<User[]>([]);

//   const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
//     null,
//   );

//   const [editDescription, setEditDescription] = useState("");
//   const [editRepo, setEditRepo] = useState("");

//   const selectedProject = projects.find((p) => p.id === selectedProjectId);

//   useEffect(() => {
//     async function load() {
//       const [projectsData, usersData] = await Promise.all([
//         api.fetchProjects(),
//         api.fetchUsers(),
//         //api.fetchUsersFromProject(projectId),
//       ]);
//       setProjects(projectsData);
//       setUsers(usersData);
//       setProjectUsers(projectUsers);
//     }
//     load();
//   }, []);

//   useEffect(() => {
//     if (!selectedProjectId) return;

//     const loadUsers = async () => {
//       try {
//         const usersFromProject =
//           await api.fetchUsersFromProject(selectedProjectId);
//         setProjectUsers(usersFromProject);
//       } catch (err) {
//         console.error("Failed to load project users", err);
//       }
//     };
//     loadUsers();
//   }, [selectedProjectId]);

//   useEffect(() => {
//     if (selectedProject) {
//       setEditDescription(selectedProject.description || "");
//       setEditRepo(selectedProject.github_repo || "");
//     } else {
//       setEditDescription("");
//       setEditRepo("");
//     }
//   }, [selectedProjectId]);

//   return (
//     <main className="p-4 bg-gray-100 min-h-screen">
//       <h1 className="text-2xl font-bold mb-6">Project Management</h1>

//       <div className="gap-6">
//         {/* ================= TABLE ================= */}
//         <div className="w-full bg-white rounded shadow overflow-hidden">
//           <table className="w-full text-sm">
//             <thead className="bg-gray-200">
//               <tr>
//                 <th className="p-2 text-left">Name</th>
//                 <th className="p-2 text-left">Description</th>
//                 <th className="p-2 text-left">GitHub Repo</th>
//                 <th className="p-2 text-left">Created At</th>
//                 <th className="p-2 text-center">Actions</th>
//               </tr>
//             </thead>

//             <tbody>
//               {projects.map((p) => (
//                 <tr key={p.id} className="border-t hover:bg-gray-50">
//                   <td className="p-2">{p.name}</td>
//                   <td className="p-2">{p.description}</td>
//                   <td className="p-2">{p.github_repo || "-"}</td>
//                   <td className="p-2">{p.created_at}</td>
//                   <td className="p-2 text-center">
//                     <button
//                       className="text-blue-600 hover:underline"
//                       onClick={() => setSelectedProjectId(p.id)}
//                     >
//                       Edit project
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* ================= EDIT PANEL ================= */}
//         <div className="w-full bg-white rounded shadow p-6 my-4">
//           <h2 className="text-xl font-semibold mb-4">Edit Project</h2>

//           {!selectedProject ? (
//             <p className="text-gray-500 italic">
//               Wybierz projekt z tabeli, aby rozpocząć edycję
//             </p>
//           ) : (
//             <>
//               <div className="flex">
//                 <div className="w-1/2 p-4">
//                   {/* Description */}
//                   <label className="block text-sm font-medium mb-1">
//                     Description
//                   </label>
//                   <input
//                     value={editDescription}
//                     onChange={(e) => setEditDescription(e.target.value)}
//                     className="border rounded px-2 py-1 w-full mb-4"
//                   />

//                   {/* GitHub Repo */}
//                   <label className="block text-sm font-medium mb-1">
//                     GitHub Repo
//                   </label>
//                   <input
//                     value={editRepo}
//                     onChange={(e) => setEditRepo(e.target.value)}
//                     placeholder="owner/repo"
//                     className="border rounded px-2 py-1 w-full mb-4"
//                   />

//                   <button
//                     className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
//                     onClick={async () => {
//                       const updated = await api.updateProject(
//                         selectedProject.id,
//                         editDescription,
//                         editRepo,
//                       );

//                       setProjects((prev) =>
//                         prev.map((p) => (p.id === updated.id ? updated : p)),
//                       );
//                     }}
//                   >
//                     Save Changes
//                   </button>

//                   {/* MEMBERS */}
//                   <div className="mt-6">
//                     <h3 className="text-md font-semibold mb-2">
//                       Project Members
//                     </h3>

//                     <ul className="mb-3">
//                       {projectUsers.map((u) => (
//                         <li
//                           key={u.id}
//                           className="flex justify-between text-sm mb-1"
//                         >
//                           {u.name}
//                           <button
//                             className="text-red-600 hover:underline"
//                             onClick={async () => {
//                               await api.removeMember(selectedProject.id, u.id);
//                               setProjectUsers((prev) =>
//                                 prev.filter((x) => x.id !== u.id),
//                               );
//                             }}
//                           >
//                             Remove
//                           </button>
//                         </li>
//                       ))}
//                     </ul>

//                     <select
//                       className="border p-2 rounded w-full"
//                       onChange={async (e) => {
//                         const userId = Number(e.target.value);
//                         if (!userId) return;

//                         await api.addMember(selectedProject.id, userId);

//                         const addedUser = users.find((u) => u.id === userId);
//                         if (addedUser) {
//                           setProjectUsers((prev) => [...prev, addedUser]);
//                         }
//                       }}
//                     >
//                       <option value="">Add user</option>
//                       {users.map((u) => (
//                         <option key={u.id} value={u.id}>
//                           {u.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* DELETE */}
//                   <div className="mt-6 border-t pt-4">
//                     <button
//                       className="text-red-600 hover:underline"
//                       onClick={async () => {
//                         if (!confirm("Delete this project?")) return;

//                         await api.deleteProject(selectedProject.id);
//                         setProjects((prev) =>
//                           prev.filter((p) => p.id !== selectedProject.id),
//                         );
//                         setSelectedProjectId(null);
//                       }}
//                     >
//                       Delete project
//                     </button>
//                   </div>
//                 </div>
//                 <div className="w-1/2 p-4">
//                   <table className="w-full text-sm">
//                     <thead className="bg-gray-200">
//                       <tr>
//                         <th className="p-2 text-left">Name</th>
//                         <th className="p-2 text-left">Action</th>
//                       </tr>
//                     </thead>

//                     <tbody>
//                       {projectUsers.map((p) => (
//                         <tr key={p.id} className="border-t hover:bg-gray-50">
//                           <td className="p-2">{p.name}</td>
//                           <td className="p-2 text-center">
//                             <button
//                               className="text-blue-600 hover:underline"
//                               onClick={() => setSelectedProjectId(p.id)}
//                             >
//                               Edit project
//                             </button>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </main>
//   );
// }

function useProjectsApi() {
  const { apiFetch } = useApi();

  return {
    fetchProjects: () => apiFetch("http://localhost:4000/api/projects"),
    fetchUsers: () => apiFetch("http://localhost:4000/api/users"),

    fetchUsersFromProject: (projectId: number) =>
      apiFetch(`http://localhost:4000/api/projects/${projectId}/users`),

    updateProject: (
      projectId: number,
      description: string,
      githubRepo: string,
    ) =>
      apiFetch(`http://localhost:4000/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          github_repo: githubRepo || null,
        }),
      }),

    addMember: (projectId: number, userId: number) =>
      apiFetch(
        `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
        { method: "POST" },
      ),

    removeMember: (projectId: number, userId: number) =>
      apiFetch(
        `http://localhost:4000/api/projects/${projectId}/members/${userId}`,
        { method: "DELETE" },
      ),

    deleteProject: (projectId: number) =>
      apiFetch(`http://localhost:4000/api/projects/${projectId}`, {
        method: "DELETE",
      }),

    createProject: (name: string, desc: string, githubRepo: string | null) =>
      apiFetch("http://localhost:4000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, desc, repo: githubRepo }),
      }),
  };
}

export default function ProjectsPage() {
  const api = useProjectsApi();

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projectUsers, setProjectUsers] = useState<User[]>([]);

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );

  const [editDescription, setEditDescription] = useState("");
  const [editRepo, setEditRepo] = useState("");

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectRepo, setNewProjectRepo] = useState("");
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    async function load() {
      const [projectsData, usersData] = await Promise.all([
        api.fetchProjects(),
        api.fetchUsers(),
      ]);
      setProjects(projectsData);
      setUsers(usersData);
    }
    load();
  }, []);

  /* ================= LOAD PROJECT USERS ================= */
  // useEffect(() => {
  //   if (!selectedProjectId) {
  //     setProjectUsers([]);
  //     return;
  //   }

  //   async function loadUsers() {
  //     const usersFromProject =
  //       await api.fetchUsersFromProject(selectedProjectId);
  //     setProjectUsers(usersFromProject);
  //   }

  //   loadUsers();
  // }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId === null) return;

    const loadUsers = async (projectId: number) => {
      const users = await api.fetchUsersFromProject(projectId);
      setProjectUsers(users);
    };

    loadUsers(selectedProjectId);
  }, [selectedProjectId]);

  /* ================= SYNC EDIT FIELDS ================= */
  useEffect(() => {
    if (selectedProject) {
      setEditDescription(selectedProject.description || "");
      setEditRepo(selectedProject.github_repo || "");
    } else {
      setEditDescription("");
      setEditRepo("");
    }
  }, [selectedProjectId]);

  const handleCreateProject = async () => {
    if (!newProjectName) return setCreateMessage("Project name is required");

    try {
      const project = await api.createProject(
        newProjectName,
        newProjectDesc,
        newProjectRepo,
      );
      setProjects((prev) => [...prev, project]);
      setCreateMessage(`Project "${project.name}" created!`);
      setNewProjectName("");
      setNewProjectDesc("");
      setNewProjectRepo("");
      setShowCreatePanel(false);
    } catch (err: any) {
      setCreateMessage(err?.message || "Failed to create project");
    }
  };

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      {/* <h1 className="text-2xl font-bold mb-6">Project Management</h1> */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Management</h1>
        <button
          className="cursor-pointer bg-teal-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-teal-700"
          onClick={() => setShowCreatePanel((prev) => !prev)}
        >
          <span className="text-lg font-bold">+</span> Add Project
        </button>
      </div>

      {/* {showCreatePanel && (
        <div className="bg-white rounded shadow p-6 mb-6 w-1/4">
          <h2 className="text-xl font-semibold mb-4">Create New Project</h2>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Project Name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />

            <textarea
              placeholder="Description"
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              className="border rounded px-2 py-2 w-full min-h-[80px]"
            />

            <input
              type="text"
              placeholder="GitHub Repo (owner/repo)"
              value={newProjectRepo}
              onChange={(e) => setNewProjectRepo(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />

            <div className="flex gap-2">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={handleCreateProject}
              >
                Create
              </button>

              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setShowCreatePanel(false)}
              >
                Cancel
              </button>
            </div>

            {createMessage && (
              <p className="text-sm text-gray-700">{createMessage}</p>
            )}
          </div>
        </div>
      )} */}

      {/* ================= PROJECTS TABLE ================= */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm border-collapse border border-gray-200">
            <thead className="bg-gradient-to-t from-emerald-600 to-emerald-800 text-white sticky top-0">
              <tr>
                <th className="p-2 text-left first:rounded-tl-lg last:rounded-tr-lg">
                  Name
                </th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">GitHub Repo</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {projects.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-t border-gray-300 ${
                    i % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
                  }`}
                >
                  <td className="p-2 text-left w-100">{p.name}</td>
                  <td className="p-2 text-left w-120">{p.description}</td>
                  <td className="p-2 text-left w-100">
                    {p.github_repo || "-"}
                  </td>
                  <td className="p-2 text-left w-100">{p.created_at}</td>
                  <td className="p-2 text-center">
                    <button
                      className="cursor-pointer text-teal-600 hover:underline"
                      onClick={() => setSelectedProjectId(p.id)}
                    >
                      <Edit size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ===== EDIT PANEL ===== */}
        <div className="bg-white rounded-2xl shadow-lg p-8 w-1/2 border border-gray-200">
          <h2 className="w-1/2 text-2xl font-semibold mb-6 text-gray-800">
            Edit Project
          </h2>

          {!selectedProject ? (
            <p className="text-gray-500 italic">
              Wybierz projekt z tabeli, aby rozpocząć edycję
            </p>
          ) : (
            <div className="flex gap-8">
              {/* ================= LEFT: PROJECT SETTINGS ================= */}
              <div className="w-1/2 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Name
                  </label>
                  <input
                    value={editRepo}
                    onChange={(e) => setEditRepo(e.target.value)}
                    placeholder="Name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px] 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    GitHub Repo
                  </label>
                  <input
                    value={editRepo}
                    onChange={(e) => setEditRepo(e.target.value)}
                    placeholder="owner/repo"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       transition"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white mr-2 px-4 py-2 rounded-lg w-1/2 font-medium transition"
                    onClick={async () => {
                      const updated = await api.updateProject(
                        selectedProject.id,
                        editDescription,
                        editRepo,
                      );

                      setProjects((prev) =>
                        prev.map((p) => (p.id === updated.id ? updated : p)),
                      );
                    }}
                  >
                    Save Changes
                  </button>

                  <button
                    className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg w-1/2 font-medium transition"
                    onClick={async () => {
                      if (!confirm("Delete this project?")) return;

                      await api.deleteProject(selectedProject.id);
                      setProjects((prev) =>
                        prev.filter((p) => p.id !== selectedProject.id),
                      );
                      setSelectedProjectId(null);
                    }}
                  >
                    Delete Project
                  </button>
                </div>
              </div>

              {/* ================= RIGHT: USERS ================= */}
              <div className="w-1/2 bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">
                  Project Members
                </h3>

                {projectUsers.length === 0 ? (
                  <p className="text-sm text-gray-500 italic mb-4">
                    Brak użytkowników w projekcie
                  </p>
                ) : (
                  <div className="mb-4 border border-gray-200">
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-100 text-gray-600">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">
                            User
                          </th>
                          <th className="text-right px-4 py-2 font-medium">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {projectUsers.map((u) => (
                          <tr
                            key={u.id}
                            className="border-t hover:bg-gray-50 transition"
                          >
                            <td className="px-4 py-2">{u.name}</td>

                            <td className="px-4 py-2 text-right">
                              <button
                                className="cursor-pointer text-red-600 hover:text-red-700 font-medium text-sm transition"
                                onClick={async () => {
                                  await api.removeMember(
                                    selectedProject.id,
                                    u.id,
                                  );
                                  setProjectUsers((prev) =>
                                    prev.filter((x) => x.id !== u.id),
                                  );
                                }}
                              >
                                <UserRoundMinus size={20} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <select
                  className="w-full border border border-gray-300 rounded-lg px-3 py-2 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500 transition"
                  onChange={async (e) => {
                    const userId = Number(e.target.value);
                    if (!userId) return;

                    await api.addMember(selectedProject.id, userId);

                    const user = users.find((u) => u.id === userId);
                    if (user && !projectUsers.some((x) => x.id === user.id)) {
                      setProjectUsers((prev) => [...prev, user]);
                    }
                  }}
                >
                  <option value="">Add user</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ===== CREATE PANEL ===== */}
        {showCreatePanel && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-1/2">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">
              Create New Project
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-teal-600
                     focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2
                     min-h-[120px]
                     focus:outline-none focus:ring-2 focus:ring-teal-600
                     focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  GitHub Repository
                </label>
                <input
                  type="text"
                  value={newProjectRepo}
                  onChange={(e) => setNewProjectRepo(e.target.value)}
                  placeholder="owner/repo"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-teal-600
                     focus:border-blue-500 transition"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-lg font-medium transition"
                  onClick={handleCreateProject}
                >
                  Create Project
                </button>

                <button
                  className="bg-gray-500 px-5 py-2 rounded-lg border border-gray-500 text-white font-medium
                     hover:bg-gray-400 transition cursor-pointer"
                  onClick={() => setShowCreatePanel(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
