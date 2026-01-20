import { useAuth } from "../auth/AuthContext";

export function useApi() {
  const { token, logout } = useAuth();

  async function apiFetch(url: string, options: RequestInit = {}) {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    if (res.status === 401) {
      logout();
      throw new Error("Unauthorized");
    }

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  return { apiFetch };
}
