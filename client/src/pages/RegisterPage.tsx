import { useState } from "react";
import { registerUser } from "../api/auth";

export default function RegisterPage() {

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            const data = await registerUser(name, email, password);
            setMessage(`Registration has been successful: ${data.email}`);
            
            setName('');
            setEmail('');
            setPassword('');
        }
        catch (err) {
            setMessage(`Registration failed`);
            
            setName('');
            setEmail('');
            setPassword('');
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