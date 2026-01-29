import { useEffect, useState } from "react";
import { useApi } from "../hooks/apiFetch";

type User = {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "TESTER";
  createdAt: string;
};

function useUsersApi() {
  const { apiFetch } = useApi();

  return {
    fetchUsers: () => apiFetch("http://localhost:4000/api/users"),

    updateUserRole: (id: number, role: User["role"]) =>
      apiFetch(`http://localhost:4000/api/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }),

    // updateUserStatus: (id: number) =>
    //   apiFetch(`http://localhost:4000/api/users/${id}/status`, {
    //     method: "PUT",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ active }),
    //   }),

    deleteUser: (id: number) =>
      apiFetch(`http://localhost:4000/api/users/${id}/delete`, {
        method: "PUT",
      }),

    fetchMe: async () => {
      const res = await apiFetch("http://localhost:4000/api/auth/me");
      return res.user;
    },

    changePassword: (oldPassword: string, newPassword: string) =>
      apiFetch("http://localhost:4000/api/users/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      }),
  };
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<User | null>(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const api = useUsersApi();

  useEffect(() => {
    api
      .fetchUsers()
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.fetchMe().then(setMe);
  }, []);

  if (loading) {
    return <p className="p-4">Loading users...</p>;
  }

  async function handleChangePassword() {
    setPasswordError(null);
    setPasswordMsg(null);

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordMsg("Password changed successfully");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setPasswordError(e.message);
    }
  }

  console.log("oto moja rola", me?.role);
  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 w-full">Users Management</h1>
      <div className="flex items-start">
        {/* Users management for admin*/}
        {me?.role === "ADMIN" && (
          <div className="m-2 bg-white rounded shadow overflow-hidden w-[50%]">
            <table className="w-full text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>

                    <td className="p-2 text-center">
                      <select
                        className="border rounded px-2 py-1"
                        value={u.role}
                        onChange={async (e) => {
                          const role = e.target.value as User["role"];
                          try {
                            await api.updateUserRole(u.id, role);
                            const updatedUsers = await api.fetchUsers();
                            setUsers(updatedUsers);
                          } catch (err: any) {
                            alert(err?.message || "Failed to update user role");
                          }
                        }}
                      >
                        <option value="TESTER">TESTER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td className="p-2 text-center">
                      <button
                        className="text-red-600 hover:underline"
                        onClick={async () => {
                          if (!confirm("Delete user?")) return;

                          try {
                            await api.deleteUser(u.id);
                            setLoading(true);
                            const freshUsers = await api.fetchUsers();
                            setUsers(freshUsers);
                          } catch (e) {
                            alert("Failed to delete user");
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* User settings for everyone */}
        <div className="m-2 bg-white rounded shadow p-4 w-[50%]">
          <h2 className="text-xl font-bold mb-4">My Account</h2>

          {me && (
            <div className="mb-6 text-sm text-gray-700">
              <p>
                <b>Name:</b> {me.name}
              </p>
              <p>
                <b>Email:</b> {me.email}
              </p>
              <p>
                <b>Role:</b> {me.role}
              </p>
            </div>
          )}

          <h3 className="font-semibold mb-2">Change Password</h3>

          <div className="flex flex-col gap-2 max-w-sm">
            <input
              type="password"
              placeholder="Old password"
              className="border rounded px-2 py-1"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="New password"
              className="border rounded px-2 py-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm new password"
              className="border rounded px-2 py-1"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {passwordError && (
              <p className="text-red-600 text-sm">{passwordError}</p>
            )}

            {passwordMsg && (
              <p className="text-green-600 text-sm">{passwordMsg}</p>
            )}

            <button
              onClick={handleChangePassword}
              className="mt-2 bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
