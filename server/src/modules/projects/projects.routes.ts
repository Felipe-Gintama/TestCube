import { Router } from "express";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
  getAllUserProjects,
  createNewProject,
  editProject,
  deleteProject,
  allMembersOfProject,
  addMemeberToProject,
  deleteMemberFromProject,
  setGithubRepo,
  GetAllUsersFromProjectController,
} from "./projects.controller";

const router = Router();

router.get("/", authMiddleware, authMiddleware, getAllUserProjects);
router.get(
  "/:projectId/users",
  authMiddleware,
  GetAllUsersFromProjectController,
);
router.get("/:id", authMiddleware, allMembersOfProject);
router.post("/", authMiddleware, createNewProject);
router.post("/:projectId/members/:userId", authMiddleware, addMemeberToProject);
router.put("/:id", authMiddleware, editProject);
router.delete("/:id", authMiddleware, deleteProject);
router.delete(
  "/:projectId/members/:userId",
  authMiddleware,
  deleteMemberFromProject,
);
router.put("/:id/github-repo", authMiddleware, setGithubRepo);

export default router;
