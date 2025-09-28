import { useState } from "react";
import type { ReactFormState } from "react-dom/client";

export default function RegisterPage() {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    async function registerUser(name: string, email: string, password: string){
        const res = await fetch('http://localhost:4000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        if (!res.ok)
            throw new Error('Registration failed');

        return res.json();
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            const data = await registerUser(name, email, password);
            setMessage(`Registration has been successful: ${data.email}`);
        }
        catch (err){
            setMessage(`Registration failed`);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)}/>
            <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}/>
            <input placeholder="Password" value={password} type="password" onChange={e => setPassword(e.target.value)}/>
            <button type="submit">Send</button>
            <p>{message}</p>
        </form>
    );
}