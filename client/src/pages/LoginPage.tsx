// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../auth/AuthContext";
// import { loginUser } from "../api/auth";

// export default function LoginPage() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const navigate = useNavigate();
//   const { login } = useAuth();

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     try {
//       const data = await loginUser(email, password);
//       login(data.token, data.user);
//       navigate("/dashboard");
//     } catch (err) {
//       setMessage("Login failed");
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit}>
//       <input
//         placeholder="Email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//       />
//       <input
//         placeholder="Password"
//         type="password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//       />
//       <button type="submit">Login</button>
//       <p>{message}</p>
//     </form>
//   );
// }

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { loginUser } from "../api/auth";
import CubeIcon from "../assets/bitmapa.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const data = await loginUser(email, password);
      login(data.token, data.user);
      navigate("/dashboard");
    } catch {
      setMessage("Incorrect email or password");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-r from-emerald-800 to-emerald-400">
      {/* <h1 className="text-3xl font-bold text-white text-center">Test Cube</h1> */}
      {/* <div className="min-h-[600px] min-w-1/2 flex items-center justify-center bg-violet rounded-xl shadow-xl">
        <div className="w-2/3">aaa</div>
        <div className="w-1/3 bg-white">
          <form
            onSubmit={handleSubmit}
            className="w-64 p-8 space-y-8 items-center justify-center"
          >
            <h1 className="text-2xl font-semibold text-center text-gray-800">
              Login your account
            </h1>

            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />

              <input
                type="password"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {message && (
              <p className="font-semibold text-sm text-red-500 text-center">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="w-full font-semibold bg-violet-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Sign in
            </button>
          </form>
        </div>
      </div> */}
      <div className="min-h-[600px] max-h-[700px] min-w-2/3 flex bg-gray-100 rounded-xl shadow-xl">
        <div className="w-2/3 flex items-center justify-center text-white text-3xl rounded-l-xl bg-gradient-to-r from-emerald-800 to-emerald-400">
          {/* <img className="max-h-full max-w-full" src={CubeIcon} alt="banner" /> */}
          <div className="flex items-center justify-center ">
            <div className="relative w-48 h-48 perspective">
              <div className="relative w-full h-full transform-style-preserve-3d animate-spinCube">
                {/* Front */}
                <div
                  className="absolute w-full h-full bg-emerald-900 flex items-center justify-center text-white text-xl"
                  style={{ transform: "translateZ(96px)" }}
                ></div>
                {/* Back */}
                <div
                  className="absolute w-full h-full bg-emerald-900 flex items-center justify-center text-white text-xl"
                  style={{ transform: "rotateY(180deg) translateZ(96px)" }}
                ></div>
                {/* Right */}
                <div
                  className="absolute w-full h-full bg-emerald-800 flex items-center justify-center text-white text-xl"
                  style={{ transform: "rotateY(90deg) translateZ(96px)" }}
                ></div>
                {/* Left */}
                <div
                  className="absolute w-full h-full bg-emerald-700 flex items-center justify-center text-white text-xl"
                  style={{ transform: "rotateY(-90deg) translateZ(96px)" }}
                ></div>
                {/* Top */}
                <div
                  className="absolute w-full h-full bg-emerald-600 flex items-center justify-center text-white text-xl"
                  style={{ transform: "rotateX(90deg) translateZ(96px)" }}
                ></div>
                {/* Bottom */}
                <div
                  className="absolute w-full h-full bg-emerald-500 flex items-center justify-center text-white text-xl"
                  style={{ transform: "rotateX(-90deg) translateZ(96px)" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
        <div className="w-1/3 flex items-center justify-center">
          <form
            className="w-full max-w-sm p-16 space-y-6"
            onSubmit={handleSubmit}
          >
            <h1 className="text-2xl font-semibold text-center text-gray-800">
              Login your account
            </h1>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Hasło"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition"
              type="submit"
              onSubmit={handleSubmit}
            >
              Sign in
            </button>
            <div className="flex flex-col items-center justify-center">
              <p className="text-sm font-semibold text-center text-gray-800">
                First time? Click below to create account
              </p>
              <NavLink
                to="/register"
                className="bg-emerald-400 text-white m-4 px-4 py-2 rounded-md hover:bg-emerald-700 transition"
              >
                Create account
              </NavLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
