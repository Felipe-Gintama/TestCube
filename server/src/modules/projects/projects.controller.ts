import { Request, Response } from "express";
import { AuthRequest } from "../../middlewares/authMiddleware";
import {
  GetAllUserProjects,
  CreateNewProject,
  EditProject,
  DeleteProject,
  GetMembersOfProject,
  AddMemeberToProject,
  DeleteMemberProject,
  updateGithubRepo,
  GetAllUsersFromProject,
} from "./projects.service";

export async function getAllUserProjects(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const usersProjects = await GetAllUserProjects(userId);

    if (usersProjects.length === 0) {
      return res.status(200).json({ message: "No projects found", data: [] });
    }

    res.status(200).json(usersProjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function GetAllUsersFromProjectController(
  req: AuthRequest,
  res: Response,
) {
  const projectId = Number(req.params.projectId);

  if (isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project ID" });
  }

  try {
    const users = await GetAllUsersFromProject(projectId);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch project users" });
  }
}

export async function createNewProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.userId;
    const { name, desc, repo } = req.body;
    const newProject = await CreateNewProject(name, desc, userId, repo);

    console.log(newProject);

    res.status(201).json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function editProject(req: AuthRequest, res: Response) {
  try {
    const projectId = req.params.id;

    if (!projectId) {
      return res.status(400).json({ error: "ID is required" });
    }
    const id = parseInt(projectId, 10);

    const updates = req.body;
    const updatedProject = await EditProject(id, updates);
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function deleteProject(req: AuthRequest, res: Response) {
  // try {
  //   const projectId = req.params.id;

  //   if (!projectId) {
  //     return res.status(400).json({ error: "ID is required" });
  //   }
  //   const id = parseInt(projectId, 10);

  //   const deleteProject = await DeleteProject(id);
  //   res.status(200).json(deleteProject);
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ error: "internal server error" });
  // }

  const projectId = Number(req.params.id);

  if (isNaN(projectId)) return res.status(400).json({ error: "Invalid ID" });

  try {
    const deletedProject = await DeleteProject(projectId);
    res.json(deletedProject);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete project" });
  }
}

export async function allMembersOfProject(req: AuthRequest, res: Response) {
  try {
    const projectId = req.params.id;

    if (!projectId) {
      return res.status(400).json({ error: "ID is required" });
    }
    const id = parseInt(projectId, 10);

    const projectMembers = await GetMembersOfProject(id);
    res.status(200).json(projectMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function addMemeberToProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId;
    const projectId = req.params.projectId;

    if (!projectId || !userId) {
      return res.status(400).json({ error: "ID is required" });
    }
    const parsedProjectId = parseInt(projectId, 10);
    const parsedUserId = parseInt(userId, 10);

    const updateMembers = await AddMemeberToProject(
      parsedProjectId,
      parsedUserId,
    );
    res.status(200).json(updateMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function deleteMemberFromProject(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId;
    const projectId = req.params.projectId;

    if (!projectId || !userId) {
      return res.status(400).json({ error: "ID is required" });
    }
    const parsedProjectId = parseInt(projectId, 10);
    const parsedUserId = parseInt(userId, 10);

    const updateMembers = await DeleteMemberProject(
      parsedProjectId,
      parsedUserId,
    );
    res.status(200).json(updateMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "internal server error" });
  }
}

export async function setGithubRepo(req: AuthRequest, res: Response) {
  const projectId = Number(req.params.id);
  const { repo } = req.body;

  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (repo && !/^[^/]+\/[^/]+$/.test(repo)) {
    return res.status(400).json({ error: "Invalid repo format" });
  }

  const project = await updateGithubRepo(projectId, repo);
  res.json(project);
}
