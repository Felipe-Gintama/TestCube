import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LayoutDashboard, Home } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const links = [
    { to: "/projects", label: "Projects" },
    { to: "/reports", label: "Reports" },
    { to: "/testing", label: "Testing" },
    { to: "/users", label: "Users" },
    { to: "/testCasesManagement", label: "Test Cases" },
    { to: "/testPlans", label: "Test Plans" },
    //{ to: "/issues", label: "Github Issues" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full shadow-lg">
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-500 shadow-lg p-4 w-full">
        <nav className="flex items-center justify-between">
          {/* LEFT – user info */}
          <div className="flex px-6 gap-4 text-white font-semibold text-sm w-1/4 justify-left">
            {user && (
              <span>
                Welcome back | {user.email} | {user.name} | {user.role}
              </span>
            )}
          </div>

          {/* CENTER – navigation */}
          <div className="flex gap-4 font-semibold justify-center w-2/4">
            {user &&
              links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-md transition ${
                      isActive
                        ? "bg-emerald-600 text-white"
                        : "text-white hover:bg-emerald-300"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
          </div>

          {/* RIGHT – auth buttons */}
          <div className="flex gap-3 w-1/4 justify-end px-6">
            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md transition ${
                      isActive ? "bg-emerald-700" : "hover:bg-emerald-300"
                    }`
                  }
                >
                  <Home size={24} />
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="bg-white text-emerald-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className="bg-white text-emerald-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  Login
                </NavLink>
                <NavLink
                  to="/register"
                  className="bg-white text-emerald-700 font-semibold px-4 py-2 rounded-md hover:bg-gray-200 transition"
                >
                  Register
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

// import { NavLink, useNavigate } from "react-router-dom";
// import { useAuth } from "../auth/AuthContext";

// export default function Navbar() {
//   const navigate = useNavigate();
//   const { logout, user } = useAuth();

//   function handleLogout() {
//     logout();
//     navigate("/login");
//   }

//   return (
//     <header className="bg-blue-400 shadow-sm sticky top-0 z-50">
//       <nav className="container mx-auto flex items-center justify-between px-6 py-4">
//         {user ? (
//           <>
//             <span className="text-white font-semibold">
//               Welcome | {user.email} | role: {user.role} | name: {user.name}
//             </span>
//             <button
//               onClick={handleLogout}
//               className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
//             >
//               Logout
//             </button>
//           </>
//         ) : (
//           <>
//             <NavLink
//               to="/login"
//               className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
//             >
//               Login
//             </NavLink>
//             <NavLink
//               to="/register"
//               className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
//             >
//               Register
//             </NavLink>
//           </>
//         )}
//       </nav>
//     </header>
//   );
// }

// import { useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import { useAuth } from "../auth/AuthContext";

// export default function Navbar() {
//   const [user, setUser] = useState<any>(null);
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   function handleLogout() {
//     localStorage.removeItem("token");
//     setUser(null);
//     navigate("/login");
//   }

//   return (
//     <header className="bg-blue-400 shadow-sm sticky top-0 z-50">
//       <nav className="container mx-auto flex items-center justify-between px-6 py-4">
//         <button
//           onClick={handleLogout}
//           className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
//         >
//           Logout
//         </button>
//         <NavLink
//           to="/"
//           className="text-2xl font-bold text-indigo-600"
//         ></NavLink>
//         <NavLink
//           to="/login"
//           className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
//         >
//           Login
//         </NavLink>
//         <NavLink
//           to="/register"
//           className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
//         >
//           Register
//         </NavLink>
//       </nav>
//     </header>
//   );
// }
