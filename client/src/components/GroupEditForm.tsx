import { useState } from "react";
import type { TestGroupNode } from "../types/testTree";

type Mode = "edit" | "add-root" | "add-subgroup";

export default function GroupEditForm({
  group,
  mode = "edit",
  parentId,
  onSave,
  onDelete,
  onAddSubgroup,
  onAddRootGroup,
}: {
  group?: TestGroupNode;
  mode?: Mode;
  parentId?: number;
  onSave?: (updatedGroup: TestGroupNode) => void;
  onDelete?: (groupId: number) => void;
  onAddSubgroup?: (parentGroupId: number, newGroup: TestGroupNode) => void;
  onAddRootGroup?: (newGroup: TestGroupNode) => void;
}) {

  if (mode === "edit" && !group) return <div className="text-gray-600">Brak wybranej grupy</div>;

  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [message, setMessage] = useState("");

  const [newSubgroupName, setNewSubgroupName] = useState("");
  const [newSubgroupDesc, setNewSubgroupDesc] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const isEdit = mode === "edit";
  const isAddRoot = mode === "add-root";
  const isAddSub = mode === "add-subgroup";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    const trimmedName = name.trim();
    const trimmedDesc = description.trim() || null;

    if (!trimmedName) {
      alert("Podaj nazwę grupy");
      return;
    }

    try {
      let res: Response;

      if (isAddRoot) {
        res = await fetch("http://localhost:4000/api/groups/projects/1/groups", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: trimmedName, description: trimmedDesc, parent_id: null }),
        });
      }

      else if (isAddSub && parentId) {
        res = await fetch(`http://localhost:4000/api/groups/${parentId}/subgroup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: trimmedName, description: trimmedDesc }),
        });
      }

      else if (isEdit && group) {
        res = await fetch(`http://localhost:4000/api/groups/${group.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: trimmedName, description: trimmedDesc }),
        });
      } else {
        throw new Error("Niepoprawny tryb formularza");
      }

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      if (isAddRoot && onAddRootGroup) onAddRootGroup(data);
      if (isAddSub && onAddSubgroup && parentId) onAddSubgroup(parentId, data);
      if (isEdit && onSave && group)
        onSave({ ...group, name: trimmedName, description: trimmedDesc ?? "" });

      setMessage("Zapisano pomyślnie!");
      if (isAddRoot || isAddSub) {
        setName("");
        setDescription("");
      }
    } catch (err) {
      console.error(err);
      setMessage("Nie udało się zapisać grupy");
    }
  }

  async function handleDelete() {
    const token = localStorage.getItem("token");
    if (!token || !group) return;

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
  }


  async function handleAddSubgroup(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token || !group) return;
    if (!newSubgroupName.trim()) return alert("Podaj nazwę podgrupy");

    try {
      const res = await fetch(`http://localhost:4000/api/groups/${group.id}/subgroup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newSubgroupName.trim(),
          description: newSubgroupDesc.trim() || null,
        }),
      });

      if (!res.ok) throw new Error("Add subgroup failed");
      const newGroup = await res.json();

      if (onAddSubgroup) onAddSubgroup(group.id, newGroup);

      setNewSubgroupName("");
      setNewSubgroupDesc("");
      setShowAddForm(false);
      setMessage(`Dodano nową podgrupę: ${newGroup.name}`);
    } catch (err) {
      console.error(err);
      alert("Nie udało się dodać podgrupy");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-md w-full">
      <h2 className="text-xl font-bold mb-4">
        {isEdit && `Edytuj grupę: ${group?.name}`}
        {isAddRoot && "Dodaj nową grupę główną"}
        {isAddSub && "Dodaj nową podgrupę"}
      </h2>

      <label className="block mb-2">
        Nazwa
        <input
          className="w-full border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <label className="block mb-2">
        Opis
        <textarea
          className="w-full border p-2 rounded"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer"
        >
          {isEdit ? "Zapisz zmiany" : "Dodaj grupę"}
        </button>

        {isEdit && (
          <button
            type="button"
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
            onClick={() => handleDelete()}
          >
            Usuń
          </button>
        )}
      </div>

      {isEdit && (
        <div className="mt-6 border-t pt-4">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer"
          >
            {showAddForm ? "Anuluj dodawanie podgrupy" : "Dodaj podgrupę"}
          </button>

          {showAddForm && (
            <div className="mt-4 bg-gray-50 p-3 rounded border">
              <h3 className="font-semibold mb-2">Nowa podgrupa</h3>

              <input
                className="w-full border p-2 mb-2 rounded"
                placeholder="Nazwa podgrupy"
                value={newSubgroupName}
                onChange={(e) => setNewSubgroupName(e.target.value)}
              />

              <textarea
                className="w-full border p-2 mb-2 rounded"
                placeholder="Opis podgrupy"
                value={newSubgroupDesc}
                onChange={(e) => setNewSubgroupDesc(e.target.value)}
              />

              <button
                type="button"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                onClick={handleAddSubgroup}
              >
                Dodaj podgrupę
              </button>
            </div>
          )}
        </div>
      )}

      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </form>
  );
}
