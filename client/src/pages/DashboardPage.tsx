import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
        <h1>Welcome, {user.email}!</h1>
        <p>Your role: {user.role}</p>
        <button onClick={handleLogout}>Logout</button>
        </div>
    );
}
