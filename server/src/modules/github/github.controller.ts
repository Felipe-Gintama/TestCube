// src/modules/github/github.controller.ts
import { Request, Response } from "express";
import fetch from "node-fetch";

export async function createGithubIssue(req: Request, res: Response) {
  const { repo, title, body } = req.body;
  const token = process.env.GITHUB_TOKEN; // token w .env

  if (!repo || !title) {
    return res.status(400).json({ error: "Repo and title are required" });
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, body }),
      },
    );

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json(errData);
    }

    const data = await response.json();
    return res.status(201).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create GitHub issue" });
  }
}
