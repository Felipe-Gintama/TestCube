// import { useState } from "react";
// import { registerUser } from "../api/auth";

// export default function RegisterPage() {

//     const [name, setName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [message, setMessage] = useState('');

//     async function handleSubmit(e: React.FormEvent) {
//         e.preventDefault();

//         try {
//             const data = await registerUser(name, email, password);
//             setMessage(`Registration has been successful: ${data.email}`);

//             setName('');
//             setEmail('');
//             setPassword('');
//         }
//         catch (err) {
//             setMessage(`Registration failed`);

//             setName('');
//             setEmail('');
//             setPassword('');
//         }
//     }

//     return (
//         <form onSubmit={handleSubmit}>
//             <input placeholder="Name" value={name} onChange={e => setName(e.target.value)}/>
//             <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
//             <input placeholder="Password" value={password} type="password" onChange={e => setPassword(e.target.value)}/>
//             <button type="submit">Send</button>
//             <p>{message}</p>
//         </form>
//     );
// }

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await registerUser(name, email, password);
      navigate("/login");
    } catch {
      setMessage("Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-r from-emerald-800 to-emerald-400">
      <div className="min-h-[600px] max-h-[700px] min-w-2/3 flex bg-gray-100 rounded-xl shadow-xl">
        {/* LEFT SIDE – banner (ten sam co login) */}
        <div className="w-2/3 flex items-center justify-center text-white text-3xl rounded-l-xl bg-gradient-to-r from-emerald-800 to-emerald-400">
          <div className="relative w-48 h-48 perspective">
            <div className="relative w-full h-full transform-style-preserve-3d animate-spinCube">
              <div
                className="absolute w-full h-full bg-emerald-900"
                style={{ transform: "translateZ(96px)" }}
              />
              <div
                className="absolute w-full h-full bg-emerald-900"
                style={{ transform: "rotateY(180deg) translateZ(96px)" }}
              />
              <div
                className="absolute w-full h-full bg-emerald-800"
                style={{ transform: "rotateY(90deg) translateZ(96px)" }}
              />
              <div
                className="absolute w-full h-full bg-emerald-700"
                style={{ transform: "rotateY(-90deg) translateZ(96px)" }}
              />
              <div
                className="absolute w-full h-full bg-emerald-600"
                style={{ transform: "rotateX(90deg) translateZ(96px)" }}
              />
              <div
                className="absolute w-full h-full bg-emerald-500"
                style={{ transform: "rotateX(-90deg) translateZ(96px)" }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – form */}
        <div className="w-1/3 flex items-center justify-center">
          <form
            className="w-full max-w-sm p-16 space-y-6"
            onSubmit={handleSubmit}
          >
            <h1 className="text-2xl font-semibold text-center text-gray-800">
              Create account
            </h1>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <p className="text-sm font-semibold text-red-500 text-center">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition font-semibold"
            >
              Sign up
            </button>

            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-gray-800">
                Already have an account?
              </p>
              <NavLink
                to="/login"
                className="bg-emerald-400 text-white px-4 py-2 rounded-md hover:bg-emerald-700 transition"
              >
                Back to login
              </NavLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
