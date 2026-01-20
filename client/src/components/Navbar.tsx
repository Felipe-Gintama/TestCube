import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="bg-blue-400 shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto flex items-center justify-between px-6 py-4">
        {user ? (
          <>
            <span className="text-white font-semibold">
              Welcome | {user.email} | role: {user.role} | name: {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink
              to="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Login
            </NavLink>
            <NavLink
              to="/register"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
            >
              Register
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

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
