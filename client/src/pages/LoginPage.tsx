import { useState } from "react";
import { loginUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            const data = await loginUser(email, password);
            localStorage.setItem("token", data.token);
            setMessage(`Login successful: ${data.token}`);

            setEmail('');
            setPassword('');
            
            navigate("/dashboard"); 
        }
        catch (err) {
            setMessage(`Login failed`);

            setEmail('');
            setPassword('');
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
            <input placeholder="Password" value={password} type="password" onChange={e => setPassword(e.target.value)}/>
            <button type="submit">Login</button>
            <p>{message}</p>
        </form>
    );
}