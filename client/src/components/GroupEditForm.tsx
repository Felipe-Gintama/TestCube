import { useState } from "react";
import type { TestGroupNode } from "../types/testTree";

type Mode = "edit" | "add-root" | "add-subgroup";

interface Props {
  group?: TestGroupNode;
  mode?: Mode;
  parentId?: number;
  onSave?: (updatedGroup: TestGroupNode) => void;
  onDelete?: (groupId: number) => void;
  onAddSubgroup?: (parentGroupId: number, newGroup: TestGroupNode) => void;
  onAddRootGroup?: (newGroup: TestGroupNode) => void;
  onAddTest?: (group: TestGroupNode) => void;
}

export default function GroupEditForm({
  group,
  mode = "edit",
  parentId,
  onSave,
  onDelete,
  onAddSubgroup,
  onAddRootGroup,
  onAddTest,
}: Props) {
  const isEdit = mode === "edit";
  const isAddRoot = mode === "add-root";
  const isAddSub = mode === "add-subgroup";

  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [message, setMessage] = useState("");

  const [showSubForm, setShowSubForm] = useState(false);
  const [subName, setSubName] = useState("");
  const [subDesc, setSubDesc] = useState("");

  // ----------------------------
  // Save group handler
  // ----------------------------
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const trimmedName = name.trim();
    if (!trimmedName) return alert("Podaj nazwę grupy");

    const trimmedDesc = description.trim() || null;

    try {
      let res: Response;

      if (isAddRoot) {
        res = await fetch(
          "http://localhost:4000/api/groups/projects/1/groups",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: trimmedName,
              description: trimmedDesc,
              parent_id: null,
            }),
          },
        );
      } else if (isAddSub && parentId) {
        res = await fetch(
          `http://localhost:4000/api/groups/${parentId}/subgroup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: trimmedName,
              description: trimmedDesc,
            }),
          },
        );
      } else if (isEdit && group) {
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

      // Call callbacks
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
  };

  // ----------------------------
  // Delete group
  // ----------------------------
  const handleDelete = async () => {
    const token = localStorage.getItem("token");
    if (!token || !group) return;

    try {
      const res = await fetch(`http://localhost:4000/api/groups/${group.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setMessage("Grupa została usunięta");
      onDelete?.(group.id);
    } catch (err) {
      console.error(err);
      alert("Nie udało się usunąć grupy");
    }
  };

  // ----------------------------
  // Add sub-group
  // ----------------------------
  const handleAddSubgroup = async () => {
    const token = localStorage.getItem("token");
    if (!token || !group) return;
    if (!subName.trim()) return alert("Podaj nazwę podgrupy");

    try {
      const res = await fetch(
        `http://localhost:4000/api/groups/${group.id}/subgroup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: subName.trim(),
            description: subDesc.trim() || null,
          }),
        },
      );
      if (!res.ok) throw new Error("Add subgroup failed");

      const newGroup = await res.json();
      onAddSubgroup?.(group.id, newGroup);
      setSubName("");
      setSubDesc("");
      setShowSubForm(false);
      setMessage(`Dodano nową podgrupę: ${newGroup.name}`);
    } catch (err) {
      console.error(err);
      alert("Nie udało się dodać podgrupy");
    }
  };

  // ----------------------------
  // Render
  // ----------------------------
  // return (
  //   <form onSubmit={handleSave} className="p-4 bg-white rounded shadow-md w-full">
  //     <h2 className="text-xl font-bold mb-4">
  //       {isEdit && `Edytuj grupę: ${group?.name}`}
  //       {isAddRoot && "Dodaj nową grupę główną"}
  //       {isAddSub && "Dodaj nową podgrupę"}
  //     </h2>

  //     <label className="block mb-2">
  //       Nazwa
  //       <input className="w-full border p-2 rounded" value={name} onChange={(e) => setName(e.target.value)} />
  //     </label>

  //     <label className="block mb-2">
  //       Opis
  //       <textarea className="w-full border p-2 rounded" value={description} onChange={(e) => setDescription(e.target.value)} />
  //     </label>

  //     <div className="flex gap-2 mt-3">
  //       <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
  //         {isEdit ? "Zapisz zmiany" : "Dodaj grupę"}
  //       </button>

  //       {isEdit && (
  //         <>
  //           <button type="button" className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onClick={handleDelete}>
  //             Usuń
  //           </button>
  //           <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => onAddTest && group && onAddTest(group)}>
  //             Dodaj nowy test
  //           </button>
  //         </>
  //       )}
  //     </div>

  //     {isEdit && (
  //       <div className="mt-6 border-t pt-4">
  //         <button type="button" className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600" onClick={() => setShowSubForm((prev) => !prev)}>
  //           {showSubForm ? "Anuluj dodawanie podgrupy" : "Dodaj podgrupę"}
  //         </button>

  //         {showSubForm && (
  //           <div className="mt-4 bg-gray-50 p-3 rounded border">
  //             <h3 className="font-semibold mb-2">Nowa podgrupa</h3>
  //             <input className="w-full border p-2 mb-2 rounded" placeholder="Nazwa podgrupy" value={subName} onChange={(e) => setSubName(e.target.value)} />
  //             <textarea className="w-full border p-2 mb-2 rounded" placeholder="Opis podgrupy" value={subDesc} onChange={(e) => setSubDesc(e.target.value)} />
  //             <button type="button" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={handleAddSubgroup}>
  //               Dodaj podgrupę
  //             </button>
  //           </div>
  //         )}
  //       </div>
  //     )}

  //     {message && <p className="mt-4 text-gray-700">{message}</p>}
  //   </form>
  // );
  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-xl border border-gray-300 shadow-sm p-6 w-full max-w-2xl"
    >
      <h2 className="text-lg font-bold text-gray-800 mb-6">
        {isEdit && `Edit group: ${group?.name}`}
        {isAddRoot && "Dodaj nową grupę główną"}
        {isAddSub && "Dodaj nową podgrupę"}
      </h2>

      {/* ===== NAME ===== */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm 
                   focus:outline-none focus:ring-2 focus:ring-emerald-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* ===== DESCRIPTION ===== */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm 
                   focus:outline-none focus:ring-2 focus:ring-emerald-400"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* ===== MAIN ACTIONS ===== */}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md 
                   hover:bg-emerald-700 transition"
        >
          {isEdit ? "Save changes" : "Add group"}
        </button>

        {isEdit && (
          <>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 text-white text-sm rounded-md 
                       hover:bg-rose-700 transition"
            >
              Delete
            </button>

            <button
              type="button"
              onClick={() => onAddTest && group && onAddTest(group)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md 
                       hover:bg-blue-700 transition"
            >
              Add new test
            </button>
          </>
        )}
      </div>

      {/* ===== SUBGROUP SECTION ===== */}
      {isEdit && (
        <div className="mt-8 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setShowSubForm((prev) => !prev)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md 
                     hover:bg-indigo-700 transition"
          >
            {showSubForm ? "Cancel" : "Add subgroup"}
          </button>

          {showSubForm && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                New subgroup
              </h3>

              <input
                className="w-full border border-gray-300 px-3 py-2 mb-3 rounded-md text-sm 
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Name"
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
              />

              <textarea
                className="w-full border border-gray-300 px-3 py-2 mb-3 rounded-md text-sm 
                         focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="Description"
                rows={3}
                value={subDesc}
                onChange={(e) => setSubDesc(e.target.value)}
              />

              <button
                type="button"
                onClick={handleAddSubgroup}
                className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-md 
                         hover:bg-emerald-700 transition"
              >
                Add
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== MESSAGE ===== */}
      {message && (
        <div className="mt-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-3">
          {message}
        </div>
      )}
    </form>
  );
}
