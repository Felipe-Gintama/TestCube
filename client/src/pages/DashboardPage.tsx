import { NavLink } from "react-router-dom";

export default function DashboardPage() {
  return (
    // <div>
    //     <NavLink to="/projects" className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
    //         Projects
    //     </NavLink>
    //     <h1>Welcome, {user.email}!</h1>
    //     <p>Your role: {user.role}</p>
    //     <a className="cursor:pointer">
    //         <button onClick={handleLogout} className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">Logout</button>
    //     </a>
    // </div>
    <div className="flex min-h-screen bg-gray-200">
      <aside className="w-64 bg-gray-100 text-black flex flex-col p-4">
        <nav className="flex flex-col gap-2">
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-300 font-semibold" : ""
              }`
            }
          >
            Projects
          </NavLink>
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Raports
          </NavLink>
          <NavLink
            to="/testing"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Testing
          </NavLink>
          <NavLink
            to="/roles"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            User management
          </NavLink>
          <NavLink
            to="/testCasesManagement"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Add/Delete test cases
          </NavLink>
          <NavLink
            to="/testPlans"
            className={({ isActive }) =>
              `p-2 rounded-md hover:bg-gray-200 transition ${
                isActive ? "bg-gray-800 font-semibold" : ""
              }`
            }
          >
            Test plan manager
          </NavLink>
        </nav>
      </aside>
      <main></main>
    </div>
  );
}
