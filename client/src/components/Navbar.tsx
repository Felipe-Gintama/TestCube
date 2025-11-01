import { NavLink } from "react-router-dom";

export default function Navbar() {
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="container mx-auto flex items-center justify-between px-6 py-4">
                <NavLink to="/" className="text-2xl font-bold text-indigo-600">
                </NavLink>
                <NavLink to="/login"className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                    Login
                </NavLink>
                <NavLink to="/register"className="hidden md:inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                    Register
                </NavLink>
            </nav>
        </header>
    )
}