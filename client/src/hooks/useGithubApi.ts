import { useApi } from "./apiFetch";

export function useGithubApi() {
  const { apiFetch } = useApi();

  return {
    createIssue: (repo: string, title: string, body?: string) =>
      apiFetch("http://localhost:4000/api/github/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, title, body }),
      }),
  };
}
