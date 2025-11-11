import { useState } from "react";

export default function NewProjectForm() {
  
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [message, setMessage] = useState('');

    async function handleSubmit (e: React.FormEvent) {
        e.preventDefault();
        console.log("Tworzenie projektu:", name);
        const token = localStorage.getItem("token");
        try {
            const data = await fetch('http://localhost:4000/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, },
                body: JSON.stringify({ name, desc })
            });
            const dataParsed = await data.json();
            setMessage(`Project creating successful: ${dataParsed.name}`);
            setName('');
            setDesc('');
        }
        catch (error) {
            setMessage(`Registration failed`);
            setName('');
            setDesc('');
        }
    }

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Utwórz nowy projekt</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input type="text" placeholder="Nazwa projektu" value={name} onChange={(e) => setName(e.target.value)} className="border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"/>
            <input type="text" placeholder="Opis projektu" value={desc} onChange={(e) => setDesc(e.target.value)} className="border p-2 rounded-md focus:outline-none focus:ring focus:ring-blue-300"/>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
                Zapisz
            </button>
        </form>
        {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
  );
}
