import { useState } from "react";
import type { TestGroupNode } from "../types/testTree";

export default function GroupEditForm({ group, onSave, onDelete, onAddSubgroup }: {
  group: TestGroupNode;
  onSave?: (updatedGroup: TestGroupNode) => void;
  onDelete?: (groupId: number) => void;
  onAddSubgroup?: (parentGroupId: number, newGroup: TestGroupNode) => void;
}) {

  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? "");
  const [message, setMessage] = useState('');

  const [newSubgroupName, setNewSubgroupName] = useState("");
  const [newSubgroupDesc, setNewSubgroupDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddSubgroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    if (!newSubgroupName.trim()) return alert("Podaj nazwę podgrupy");

    try {
      const res = await fetch(`http://localhost:4000/api/groups/${group.id}/subgroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({name: newSubgroupName.trim()}),
      });

      if (!res.ok) throw new Error("Add subgroup failed");
      const newGroup = await res.json();

      if (onAddSubgroup) onAddSubgroup(group.id, newGroup);

      setNewSubgroupName("");
      setNewSubgroupDesc("");
      setMessage(`Dodano nową podgrupę: ${newGroup.name}`);
    } catch (err) {
      console.error(err);
      alert("Nie udało się dodać podgrupy");
    }
  };

  async function handleDelete (groupId: number) {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:4000/api/groups/${group.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Delete failed");
      
      setMessage("Grupa została usunięta");

      if (onDelete) onDelete(group.id);

    } catch (err) {
      console.error(err);
      alert("Nie udało się usunąć grupy");
    }
  };


  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault();

    const finalName = name.trim() === "" ? null : name;
    const finalDescription = description.trim() === "" ? null : description;

    console.log("Zapisuję grupę:", { 
      id: group.id, 
      name: finalName, 
      description: finalDescription 
    });

    const token = localStorage.getItem("token");


    try {
        const data = await fetch(`http://localhost:4000/api/groups/${group.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, },
            body: JSON.stringify({
              name: finalName, 
              description: finalDescription
            })
        });
        const dataParsed = await data.json();
        setMessage(`Group has been updated: ${dataParsed.name}, ${dataParsed.description}`);

        if (onSave) onSave({
          ...group,
          name: finalName ?? "",
          description: finalDescription ?? "",
        });
    }
    catch (error) {
        setMessage(`Registration failed`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-md w-full">
      <h2 className="text-xl font-bold mb-4">Edytuj grupę: {group.name}</h2>

      <label className="block mb-2">
        Nazwa
        <input
          className="w-full border p-2 rounded"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </label>

      <label className="block mb-2">
        Opis
        <textarea
          className="w-full border p-2 rounded"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </label>

      <button type="submit" className="mt-3 px-4 py-2 mr-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
        Zapisz
      </button>
      <button type="button" className="px-4 py-2 mr-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer" onClick={() => handleDelete(group.id) }>
        Usuń
      </button>
      <button
        type="button"
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
        onClick={() => setShowAddForm(prev => !prev)}
      >
        {showAddForm ? "Anuluj dodawanie podgrupy" : "Dodaj podgrupę"}
      </button>
      {showAddForm && (
        <div className="mt-4 border-t pt-4">
          <input
            className="w-full border p-2 mb-2 rounded"
            placeholder="Nazwa podgrupy"
            value={newSubgroupName}
            onChange={e => setNewSubgroupName(e.target.value)}
          />
          <textarea
            className="w-full border p-2 mb-2 rounded"
            placeholder="Opis podgrupy"
            value={newSubgroupDesc}
            onChange={e => setNewSubgroupDesc(e.target.value)}
          />
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleAddSubgroup}
          >
            Dodaj podgrupę
          </button>
        </div>
      )}
      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </form>
  );
}
