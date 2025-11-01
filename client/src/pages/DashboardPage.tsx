import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch("http://localhost:4000/api/auth/me", {
        method: "GET",  
        mode: "cors",
        headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => res.json())
        .then((data) => setUser(data.user))
        .catch(() => console.error("Unauthorized"));
    }, []);
    
    function handleLogout() {
        localStorage.removeItem("token");
        setUser(null);
        navigate("/login");
    }

    if (!user) return <p>Loading...</p>;

    return (
        <div>
            <NavLink to="/projects" className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                Projects
            </NavLink>
            <h1>Welcome, {user.email}!</h1>
            <p>Your role: {user.role}</p>
            <a className="cursor:pointer">
                <button onClick={handleLogout} className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">Logout</button>
            </a>
        </div>
    );
}
